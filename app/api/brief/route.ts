import { NextRequest, NextResponse } from 'next/server'
import { listAudiences } from '@/lib/audienceStudio'
import { anthropic } from '@/lib/anthropic'
import { extractJsonObject } from '@/lib/json'
import { fieldsFor, typeLabel, type FieldDef, type IdeaType } from '@/lib/stimulus'
import {
  getCurrentCompany,
  NoActiveCompanyError,
  NoCompanyError,
  NotAuthenticatedError,
} from '@/lib/currentCompany'
import type { BriefErrorCode, BriefQuestion, BriefResponse, IdeaBrief } from '@/lib/types'
import { checkRateLimit } from '@/lib/rate-limit'

const MODEL = 'claude-haiku-4-5-20251001'
const MAX_QUESTIONS = 5

// Generic fallback questions used only when Claude completely fails. They're
// minimal because we can't predict the type-specific fields.
const FALLBACK_BRIEF: IdeaBrief = {}
const FALLBACK_QUESTIONS: BriefQuestion[] = [
  {
    id: 'fallback-1',
    parameter: 'gap',
    question: 'What single thing should be clearer before testing this?',
    type: 'text',
    hint: 'One sentence is fine',
  },
]

function fallback(error: BriefErrorCode, detail?: string): NextResponse<BriefResponse & { detail?: string }> {
  return NextResponse.json({
    brief: FALLBACK_BRIEF,
    questions: FALLBACK_QUESTIONS,
    generated: false,
    error,
    ...(detail ? { detail } : {}),
  })
}

function extractJsonObjectSafe(text: string): string | null {
  return extractJsonObject(text)
}

function fieldSchemaJson(fields: FieldDef[]): string {
  return fields
    .map((f) => `  "${f.key}": "${f.label} (${f.kind === 'list' ? 'array of strings' : 'string'}). ${f.description}"`)
    .join(',\n')
}

function briefSchemaJson(fields: FieldDef[]): string {
  return fields
    .map((f) =>
      f.kind === 'list'
        ? `    "${f.key}": <array of strings | empty array if unknown>`
        : `    "${f.key}": <string | null>`,
    )
    .join(',\n')
}

function buildPrompt(
  ideaType: IdeaType,
  ideaText: string,
  audienceName: string,
  audienceTagline: string,
  prefilledBrief: IdeaBrief | undefined,
): string {
  const fields = fieldsFor(ideaType)

  const knownEntries = prefilledBrief
    ? Object.entries(prefilledBrief)
        .filter(([k]) => fields.some((f) => f.key === k))
        .filter(([, v]) => {
          if (Array.isArray(v)) return v.length > 0
          return typeof v === 'string' && v.trim().length > 0
        })
    : []

  const knownBlock = knownEntries.length > 0
    ? `\n\nALREADY KNOWN (preserve these verbatim in "brief"; do NOT ask questions about them):\n${
        knownEntries.map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join('\n')
      }`
    : ''

  return `You are helping prepare a ${typeLabel(ideaType)} stimulus for evaluation against an audience: "${audienceName}"${
    audienceTagline ? ` (${audienceTagline})` : ''
  }.

THE IDEA:
"${ideaText}"${knownBlock}

YOUR TASK:
1. Read the idea text carefully.
2. For each field below, extract a concise value if clearly stated or strongly inferable. Return null for string fields (or an empty array for list fields) when missing or unclear. For fields in ALREADY KNOWN, copy the value verbatim.
3. For fields you returned null/empty, generate targeted questions to ask the user. Maximum ${MAX_QUESTIONS} questions total. If the input is already clear enough to test, return ZERO questions — only ask what genuinely matters.
4. Prioritise questions by impact on testability. Skip nice-to-have fields when the idea is already clear.
5. For list-typed fields ("array of strings"), set "type": "list". For fields with a natural small answer set (e.g. price tier, stage), use "type": "choice" with 3–4 options. Otherwise "type": "text".
6. Keep question text concise (under 12 words ideally). Reference specific idea details to sharpen each question.

FIELDS (key → label and kind):
{
${fieldSchemaJson(fields)}
}

Return strict JSON only. No markdown. No preamble.

{
  "brief": {
${briefSchemaJson(fields)}
  },
  "questions": [
    {
      "id": "q1",
      "parameter": "<one of the field keys above>",
      "question": "<question text>",
      "type": "text" | "choice" | "list",
      "choices": ["<option 1>", "<option 2>", "<option 3>"],
      "hint": "<optional placeholder>"
    }
  ]
}`
}

function normalizeBrief(raw: unknown, fields: FieldDef[]): IdeaBrief {
  const result: IdeaBrief = {}
  if (!raw || typeof raw !== 'object') {
    for (const f of fields) result[f.key] = f.kind === 'list' ? [] : null
    return result
  }
  const r = raw as Record<string, unknown>
  for (const f of fields) {
    const v = r[f.key]
    if (f.kind === 'list') {
      if (Array.isArray(v)) {
        const cleaned = v
          .map((x) => (typeof x === 'string' ? x.trim() : ''))
          .filter((x) => x.length > 0)
        result[f.key] = cleaned
      } else if (typeof v === 'string' && v.trim().length > 0) {
        // Tolerate Claude returning a comma-separated string.
        result[f.key] = v.split(',').map((s) => s.trim()).filter(Boolean)
      } else {
        result[f.key] = []
      }
    } else {
      result[f.key] = typeof v === 'string' && v.trim().length > 0 ? v.trim() : null
    }
  }
  return result
}

function normalizeQuestions(raw: unknown, fields: FieldDef[]): BriefQuestion[] {
  if (!Array.isArray(raw)) return []
  const validKeys = new Set(fields.map((f) => f.key))
  const out: BriefQuestion[] = []
  for (const q of raw) {
    if (!q || typeof q !== 'object') continue
    const o = q as Record<string, unknown>
    const id = typeof o.id === 'string' && o.id ? o.id : `q${out.length + 1}`
    const parameter = typeof o.parameter === 'string' ? o.parameter : ''
    if (!validKeys.has(parameter)) continue
    const question = typeof o.question === 'string' ? o.question.trim() : ''
    if (!question) continue
    let type: BriefQuestion['type'] = 'text'
    if (o.type === 'choice' || o.type === 'single') type = 'single'
    else if (o.type === 'multi') type = 'multi'
    else if (o.type === 'list') type = 'list'
    const choices = Array.isArray(o.choices) ? o.choices.filter((c) => typeof c === 'string') as string[] : undefined
    const hint = typeof o.hint === 'string' ? o.hint : undefined
    out.push({ id, parameter, question, type, choices, hint })
    if (out.length >= MAX_QUESTIONS) break
  }
  return out
}

export async function POST(req: NextRequest) {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoActiveCompanyError) return NextResponse.json({ error: 'NO_ACTIVE_COMPANY' }, { status: 403 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }

  const rl = await checkRateLimit('sp-brief', ctx.companyId, 30, 60)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', retry_after_seconds: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  let body: { ideaText: string; ideaType: IdeaType; audienceId: string; prefilledBrief?: IdeaBrief }
  try {
    body = await req.json()
  } catch {
    return fallback('NO_BODY')
  }

  const { ideaText, ideaType, audienceId, prefilledBrief } = body
  if (!ideaText || !ideaType || !audienceId) return fallback('MISSING_FIELDS')

  let audienceName = audienceId
  let audienceTagline = ''
  try {
    const list = await listAudiences(ctx.apiKey)
    const a = list.audiences.find((x) => x.id === audienceId)
    if (a) {
      audienceName = a.name
      audienceTagline = a.short_definition ?? a.core_tension ?? ''
    }
  } catch (err) {
    console.error('Could not fetch audience for brief generation:', err)
  }

  const fields = fieldsFor(ideaType)
  const prompt = buildPrompt(ideaType, ideaText, audienceName, audienceTagline, prefilledBrief)

  try {
    const client = anthropic()
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 2500,
      temperature: 0.3,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = message.content[0]
    if (!block || block.type !== 'text') return fallback('EMPTY_CLAUDE_RESPONSE')

    const jsonBlock = extractJsonObjectSafe(block.text)
    if (!jsonBlock) {
      console.error('Brief generation: no JSON object found in Claude response:', block.text.slice(0, 400))
      return fallback('PARSE_ERROR')
    }
    let parsed: { brief?: unknown; questions?: unknown }
    try {
      parsed = JSON.parse(jsonBlock)
    } catch (err) {
      console.error('Brief generation: JSON.parse failed:', err)
      return fallback('PARSE_ERROR')
    }

    const brief = normalizeBrief(parsed.brief, fields)
    const questions = normalizeQuestions(parsed.questions, fields)

    const response: BriefResponse = { brief, questions, generated: true }
    return NextResponse.json(response)
  } catch (err) {
    console.error('Brief generation error:', err)
    const detail = err instanceof Error ? err.message : String(err)
    return fallback('CLAUDE_ERROR', detail)
  }
}
