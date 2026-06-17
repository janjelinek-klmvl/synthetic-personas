'use client'

import { useMemo, useState } from 'react'
import { useAudiences } from '@/lib/personas'
import type { RunRecord, PerAudienceState } from '@/lib/store'
import type { RunResultPayload } from '@/lib/types-as'
import Debrief from './debrief/Debrief'
import AudienceOverview from './debrief/AudienceOverview'
import Cap from '@/components/design/Cap'
import { SX, FONT, PAGE_W } from '@/lib/design/tokens'

interface Props {
  record: RunRecord | null
  loading: boolean
  error: string | null
}

// ReportSection — top-level renderer for a completed run.
// Handles error / loading / multi-audience tab switching. The actual
// chaptered report is in <Debrief />.
export default function ReportSection({ record, loading, error }: Props) {
  const { byId, quantMetrics, qualModules } = useAudiences()
  const audienceIds = record?.audience_ids ?? []
  const [activeId, setActiveId] = useState<string | null>(audienceIds[0] ?? null)

  const effectiveActiveId = useMemo(() => {
    if (activeId && audienceIds.includes(activeId)) return activeId
    return audienceIds[0] ?? null
  }, [activeId, audienceIds])

  if (error) {
    return (
      <div style={panelStyle}>
        <Cap color={SX.accent} size={11}>
          Run failed
        </Cap>
        <div style={{ color: SX.soft, fontSize: 13, marginTop: 8, fontFamily: FONT.grotesque }}>{error}</div>
      </div>
    )
  }

  if (loading || !record) return null

  const activeState: PerAudienceState | undefined = effectiveActiveId
    ? record.per_audience[effectiveActiveId]
    : undefined

  return (
    <div>
      {audienceIds.length > 1 && effectiveActiveId && (
        <AudienceOverview
          record={record}
          activeId={effectiveActiveId}
          byId={byId}
          quantMetrics={quantMetrics}
          onSelect={setActiveId}
        />
      )}

      {effectiveActiveId && activeState && (
        <AudienceReport
          spRunId={record.run_id}
          audienceId={effectiveActiveId}
          state={activeState}
          quantMetrics={quantMetrics}
          qualModules={qualModules}
        />
      )}
    </div>
  )
}

function AudienceReport({
  spRunId,
  audienceId,
  state,
  quantMetrics,
  qualModules,
}: {
  spRunId: string
  audienceId: string
  state: PerAudienceState
  quantMetrics: ReturnType<typeof useAudiences>['quantMetrics']
  qualModules: ReturnType<typeof useAudiences>['qualModules']
}) {
  const { byId } = useAudiences()
  const audience = byId(audienceId)

  if (state.status === 'queued' || state.status === 'running') {
    return (
      <div style={panelStyle}>
        <Cap color={SX.soft} size={10.5}>
          {audience?.name ?? audienceId}
        </Cap>
        <div style={{ marginTop: 6, color: SX.soft, fontFamily: FONT.grotesque, fontSize: 13 }}>
          {state.progress_step ? `Running — ${state.progress_step}…` : 'Running…'}
        </div>
      </div>
    )
  }

  if (state.status === 'failed') {
    return (
      <div style={panelStyle}>
        <Cap color={SX.accent} size={11}>
          {audience?.name ?? audienceId} · failed
        </Cap>
        <div style={{ marginTop: 8, color: SX.soft, fontSize: 13, fontFamily: FONT.grotesque }}>
          {state.error?.message ?? state.error?.code ?? 'Unknown error'}
        </div>
      </div>
    )
  }

  const result: RunResultPayload | null | undefined = state.result
  if (!result) {
    return (
      <div style={panelStyle}>
        <div style={{ fontFamily: FONT.grotesque, fontSize: 14, color: SX.soft }}>
          {audience?.name ?? audienceId} succeeded but no result body was returned.
        </div>
      </div>
    )
  }

  return (
    <Debrief
      spRunId={spRunId}
      audienceId={audienceId}
      audience={audience ?? null}
      result={result}
      quantMetrics={quantMetrics}
      qualModules={qualModules}
    />
  )
}

function StatusPill({ status }: { status?: PerAudienceState['status'] }) {
  if (!status) return null
  const colors: Record<PerAudienceState['status'], string> = {
    queued: SX.soft,
    running: SX.warn,
    succeeded: SX.ok,
    failed: SX.accent,
  }
  const c = colors[status]
  return (
    <span
      style={{
        marginLeft: 6,
        padding: '2px 7px',
        border: `1px solid ${c}`,
        color: c,
        fontFamily: FONT.grotesque,
        fontSize: 9,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
      }}
    >
      {status}
    </span>
  )
}

const panelStyle: React.CSSProperties = {
  background: SX.paper,
  border: `1px solid ${SX.hair}`,
  padding: 22,
  maxWidth: PAGE_W,
  margin: '0 auto',
}
