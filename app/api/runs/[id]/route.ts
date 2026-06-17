import { NextResponse } from 'next/server'
import { getRun } from '@/lib/audienceStudio'
import { loadRun, updateRun, deleteRun, type PerAudienceState, type RunRecord } from '@/lib/store'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  let session
  try {
    session = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }

  const { id } = ctx.params
  const current = await loadRun({ companyId: session.companyId }, id)
  if (!current) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })

  // Refresh any non-terminal per-audience state from AS.
  const pending = Object.entries(current.per_audience).filter(
    ([, s]) => s.as_run_id && (s.status === 'queued' || s.status === 'running')
  )

  if (pending.length === 0) {
    return NextResponse.json({ record: current })
  }

  const updates = await Promise.all(
    pending.map(async ([audienceId, state]): Promise<[string, PerAudienceState]> => {
      try {
        const res = await getRun(session.apiKey, state.as_run_id)
        return [
          audienceId,
          {
            as_run_id: state.as_run_id,
            status: res.status,
            progress_step: res.progress_step,
            result: res.result,
            latency_ms: res.latency_ms,
            error:
              res.status === 'failed'
                ? { code: res.error_code, message: res.error_message }
                : null,
          },
        ]
      } catch (err) {
        const e = err as Error
        return [
          audienceId,
          {
            ...state,
            status: 'failed',
            error: { code: 'POLL_FAILED', message: e.message },
          },
        ]
      }
    })
  )

  const next = await updateRun(
    { companyId: session.companyId, userId: session.userId },
    id,
    (r) => {
      const per = { ...r.per_audience }
      for (const [aId, s] of updates) per[aId] = s
      return { ...r, per_audience: per, overall_status: deriveOverall(per) }
    },
  )

  return NextResponse.json({ record: next })
}

export async function DELETE(_req: Request, ctx: { params: { id: string } }) {
  let session
  try {
    session = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }
  const { id } = ctx.params
  const ok = await deleteRun({ companyId: session.companyId }, id)
  if (!ok) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ deleted: id })
}

function deriveOverall(per: Record<string, PerAudienceState>): RunRecord['overall_status'] {
  const statuses = Object.values(per).map((s) => s.status)
  if (statuses.every((s) => s === 'succeeded')) return 'succeeded'
  if (statuses.every((s) => s === 'failed')) return 'failed'
  if (statuses.some((s) => s === 'queued' || s === 'running')) return 'running'
  return 'partial'
}
