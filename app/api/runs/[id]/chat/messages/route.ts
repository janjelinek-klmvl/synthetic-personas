import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { loadRun } from '@/lib/store'
import { chatRun } from '@/lib/audienceStudio'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'
import type { ChatAudienceEvidence, ChatMode } from '@/lib/types-as'

// SP chat surface — one conversation per (sp_run, user).
//
// GET  → returns the conversation + all messages
// POST → appends a user message, calls AS to generate a reply, persists both,
//        returns { user_message, assistant_message, balance }

const MAX_HISTORY_TURNS = 20

export type ChatMessageRow = {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  mode: ChatMode
  content: string
  as_run_id: string | null
  audience_id: string | null
  respondent_evidence: ChatAudienceEvidence[] | null
  credits_charged: number | null
  usage: unknown | null
  chat_query_id: string | null
  created_at: string
}

interface ConversationRow {
  id: string
  sp_run_id: string
  company_id: string
  created_by: string
  created_at: string
}

async function findOrCreateConversation(opts: {
  spRunId: string
  companyId: string
  userId: string
}): Promise<ConversationRow> {
  const { spRunId, companyId, userId } = opts
  const { data: existing } = await supabaseAdmin
    .from('chat_conversations')
    .select('id, sp_run_id, company_id, created_by, created_at')
    .eq('sp_run_id', spRunId)
    .eq('created_by', userId)
    .maybeSingle<ConversationRow>()
  if (existing) return existing

  const { data: created, error } = await supabaseAdmin
    .from('chat_conversations')
    .insert({ sp_run_id: spRunId, company_id: companyId, created_by: userId })
    .select('id, sp_run_id, company_id, created_by, created_at')
    .single<ConversationRow>()
  if (error || !created) throw new Error(`create conversation: ${error?.message ?? 'unknown'}`)
  return created
}

async function listMessages(conversationId: string): Promise<ChatMessageRow[]> {
  const { data } = await supabaseAdmin
    .from('chat_messages')
    .select('id, conversation_id, role, mode, content, as_run_id, audience_id, respondent_evidence, credits_charged, usage, chat_query_id, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
  return (data ?? []) as ChatMessageRow[]
}

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  let session
  try {
    session = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }
  const { id: spRunId } = ctx.params

  // Authorise: user must own the SP run.
  const run = await loadRun({ companyId: session.companyId }, spRunId)
  if (!run) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  const convo = await findOrCreateConversation({
    spRunId,
    companyId: session.companyId,
    userId: session.userId,
  })
  const messages = await listMessages(convo.id)
  return NextResponse.json({ conversation_id: convo.id, messages })
}

interface PostBody {
  mode: ChatMode
  content: string
  audience_id?: string          // for audience mode in multi-audience runs
  respondent_count?: number     // audience mode only
}

export async function POST(req: Request, ctx: { params: { id: string } }) {
  let session
  try {
    session = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }
  const { id: spRunId } = ctx.params

  const body = (await req.json().catch(() => null)) as PostBody | null
  if (!body || typeof body.content !== 'string' || body.content.trim().length === 0) {
    return NextResponse.json({ error: 'INVALID_BODY' }, { status: 400 })
  }
  if (body.mode !== 'report' && body.mode !== 'audience') {
    return NextResponse.json({ error: 'INVALID_MODE' }, { status: 400 })
  }

  const run = await loadRun({ companyId: session.companyId }, spRunId)
  if (!run) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Pick the AS run to chat with. If audience_id is provided, use that;
  // otherwise default to the first succeeded audience.
  const candidates = Object.entries(run.per_audience).filter(([, s]) => s.status === 'succeeded' && s.as_run_id)
  if (candidates.length === 0) {
    return NextResponse.json({ error: 'NO_SUCCEEDED_AUDIENCE' }, { status: 409 })
  }
  const chosen = body.audience_id
    ? candidates.find(([aId]) => aId === body.audience_id)
    : candidates[0]
  if (!chosen) {
    return NextResponse.json({ error: 'AUDIENCE_NOT_AVAILABLE' }, { status: 409 })
  }
  const [audienceId, audienceState] = chosen
  const asRunId = audienceState.as_run_id

  // Find/create conversation.
  const convo = await findOrCreateConversation({
    spRunId,
    companyId: session.companyId,
    userId: session.userId,
  })

  // Insert the user message first so it persists even if AS errors out.
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      conversation_id: convo.id,
      role: 'user',
      mode: body.mode,
      content: body.content.trim(),
      as_run_id: asRunId,
      audience_id: audienceId,
    })
    .select('id, conversation_id, role, mode, content, as_run_id, audience_id, respondent_evidence, credits_charged, usage, chat_query_id, created_at')
    .single<ChatMessageRow>()
  if (userErr || !userRow) {
    return NextResponse.json({ error: 'PERSIST_FAILED', detail: userErr?.message }, { status: 500 })
  }

  // Build trimmed history (last MAX_HISTORY_TURNS messages, excluding the
  // one we just inserted — that's the `question` field).
  const all = await listMessages(convo.id)
  const prior = all.filter((m) => m.id !== userRow.id)
  const history = prior
    .slice(-MAX_HISTORY_TURNS)
    .map((m) => ({ role: m.role, content: m.content }))

  // Call AS.
  let asResponse
  try {
    asResponse = await chatRun(session.apiKey, asRunId, {
      mode: body.mode,
      question: body.content.trim(),
      history,
      respondent_count: body.respondent_count,
    })
  } catch (err) {
    const e = err as Error & { status?: number; detail?: unknown }
    return NextResponse.json(
      { error: e.message, detail: e.detail ?? null, user_message: userRow },
      { status: e.status ?? 502 },
    )
  }

  // Persist assistant response.
  const { data: assistantRow, error: aErr } = await supabaseAdmin
    .from('chat_messages')
    .insert({
      conversation_id: convo.id,
      role: 'assistant',
      mode: body.mode,
      content: asResponse.content,
      as_run_id: asRunId,
      audience_id: audienceId,
      respondent_evidence: asResponse.respondent_evidence,
      credits_charged: asResponse.credits_charged,
      usage: asResponse.usage,
      chat_query_id: asResponse.chat_query_id,
    })
    .select('id, conversation_id, role, mode, content, as_run_id, audience_id, respondent_evidence, credits_charged, usage, chat_query_id, created_at')
    .single<ChatMessageRow>()
  if (aErr || !assistantRow) {
    return NextResponse.json(
      { error: 'PERSIST_FAILED', detail: aErr?.message, user_message: userRow },
      { status: 500 },
    )
  }

  return NextResponse.json({
    user_message: userRow,
    assistant_message: assistantRow,
    balance: asResponse.balance,
  })
}
