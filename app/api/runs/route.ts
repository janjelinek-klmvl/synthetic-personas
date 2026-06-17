import { NextRequest, NextResponse } from 'next/server'
import { startRun } from '@/lib/audienceStudio'
import {
  loadProposition,
  saveRun,
  newRunId,
  type RunRecord,
  type PerAudienceState,
  listRuns,
} from '@/lib/store'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'
import { renderStimulus, type IdeaType, type StimulusFields } from '@/lib/stimulus'
import { checkRateLimit } from '@/lib/rate-limit'

interface Body {
  proposition_id?: string
  audience_ids?: string[]
  mode?: 'full-context' | 'rag'
  respondent_count?: number
  quant_metric_ids?: string[]
  qual_module_ids?: string[]
}

export async function GET() {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }
  const runs = await listRuns({ companyId: ctx.companyId })
  return NextResponse.json({ runs })
}

export async function POST(request: NextRequest) {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }

  const rl = await checkRateLimit('sp-runs', ctx.companyId, 20, 60)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', retry_after_seconds: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.proposition_id || !Array.isArray(body.audience_ids) || body.audience_ids.length === 0) {
    return NextResponse.json(
      { error: 'proposition_id and non-empty audience_ids are required' },
      { status: 400 }
    )
  }

  const proposition = await loadProposition({ companyId: ctx.companyId }, body.proposition_id)
  if (!proposition) {
    return NextResponse.json({ error: 'proposition not found' }, { status: 404 })
  }

  const runId = newRunId()
  const now = new Date().toISOString()
  const perAudience: Record<string, PerAudienceState> = {}

  const ideaForAs = renderStimulus(
    proposition.idea_type as IdeaType,
    proposition.idea,
    (proposition.brief ?? {}) as StimulusFields,
  )
  const results = await Promise.all(
    body.audience_ids.map(async (audienceId): Promise<[string, PerAudienceState]> => {
      try {
        const res = await startRun(ctx.apiKey, {
          audience_id: audienceId,
          idea: ideaForAs,
          idea_type: proposition.idea_type,
          mode: body.mode,
          respondent_count: body.respondent_count,
          quant_metric_ids: body.quant_metric_ids,
          qual_module_ids: body.qual_module_ids,
        })
        return [audienceId, { as_run_id: res.run_id, status: res.status, progress_step: null }]
      } catch (err) {
        const e = err as Error & { detail?: unknown }
        return [
          audienceId,
          {
            as_run_id: '',
            status: 'failed',
            progress_step: null,
            error: { code: e.message, message: typeof e.detail === 'string' ? e.detail : null },
          },
        ]
      }
    })
  )
  for (const [id, state] of results) perAudience[id] = state

  const record: RunRecord = {
    run_id: runId,
    proposition_id: proposition.id,
    proposition_snapshot: proposition,
    audience_ids: body.audience_ids,
    per_audience: perAudience,
    overall_status: deriveOverall(perAudience),
    created_at: now,
    updated_at: now,
  }
  await saveRun({ companyId: ctx.companyId, userId: ctx.userId }, record)
  return NextResponse.json({ run_id: runId, record }, { status: 202 })
}

function deriveOverall(per: Record<string, PerAudienceState>): RunRecord['overall_status'] {
  const statuses = Object.values(per).map((s) => s.status)
  if (statuses.every((s) => s === 'succeeded')) return 'succeeded'
  if (statuses.every((s) => s === 'failed')) return 'failed'
  if (statuses.some((s) => s === 'queued' || s === 'running')) return 'running'
  return 'partial'
}
