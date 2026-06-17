'use client'

import type { RunRecord, PerAudienceState } from '@/lib/store'
import type { QuantMetricMeta } from '@/lib/types-as'
import type { AudienceCard } from '@/lib/personas'
import { SX, FONT, PAGE_W, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import BigRadar from './BigRadar'
import { bandColor, bandLabel } from '@/lib/reception-colors'
import { computeVerdict } from '@/lib/aggregate-display'

interface Props {
  record: RunRecord
  activeId: string
  byId: (id: string) => AudienceCard | undefined
  quantMetrics: QuantMetricMeta[]
  onSelect: (audienceId: string) => void
}

// Chapter 00 — Audiences card grid. Replaces the simple top tab bar for
// multi-audience runs. Each card shows the audience's name, band caps,
// huge overall score, mini radar of per-metric reception, and a one-line
// summary. Clicking a card switches the report.
export default function AudienceOverview({ record, activeId, byId, quantMetrics, onSelect }: Props) {
  const audienceIds = record.audience_ids
  const metricNameById = (id: string) => quantMetrics.find((m) => m.id === id)?.name ?? id

  return (
    <section style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '34px 48px 0' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          borderTop: `2px solid ${SX.accent}`,
          paddingTop: 12,
        }}
      >
        <Cap size={12}>Reports by audience</Cap>
        <Cap color={SX.soft} size={9.5}>
          {audienceIds.length} audiences tested · select to switch report
        </Cap>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${audienceIds.length}, 1fr)`,
          gap: 0,
          marginTop: 16,
          border: `1px solid ${SX.hair}`,
        }}
      >
        {audienceIds.map((id, i) => {
          const audience = byId(id) ?? null
          const state: PerAudienceState | undefined = record.per_audience[id]
          const result = state?.result ?? null
          const verdict = result ? computeVerdict(result, metricNameById) : null
          const isActive = id === activeId
          const status = state?.status
          const band = verdict?.band ?? null
          const bandHex = band ? bandColor(band) : SX.faint
          const scoreColor = isActive ? SX.paper : bandHex

          // Radar data — per-metric scores, capped at 8 for readability.
          const radarData = result
            ? Object.entries(result.audience_quant_results)
                .slice(0, 8)
                .map(([mid, r]) => ({
                  id: mid,
                  name: metricNameById(mid),
                  value: typeof r.score === 'number' ? r.score : 0,
                }))
            : []

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              style={{
                cursor: 'pointer',
                textAlign: 'left',
                border: 'none',
                borderLeft: i ? `1px solid ${SX.hair}` : 'none',
                background: isActive ? SX.ink : 'transparent',
                color: isActive ? SX.paper : SX.ink,
                padding: '14px 18px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                transition: 'background 120ms, color 120ms',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 12,
                  minWidth: 0,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  {isActive ? (
                    <Cap color={SX.accent} size={8} style={{ marginBottom: 4 }}>
                      Now viewing
                    </Cap>
                  ) : verdict ? (
                    <Cap color={bandHex} size={8} style={{ marginBottom: 4 }}>
                      {bandLabel(band!)}
                    </Cap>
                  ) : (
                    <Cap color={isActive ? 'rgba(251,250,247,0.5)' : SX.faint} size={8} style={{ marginBottom: 4 }}>
                      {status ?? '—'}
                    </Cap>
                  )}
                  <div
                    style={{
                      fontFamily: FONT.grotesque,
                      fontWeight: 800,
                      fontSize: 16,
                      letterSpacing: '-0.01em',
                      lineHeight: 1.1,
                      whiteSpace: 'normal',
                      overflowWrap: 'break-word',
                    }}
                  >
                    {audience?.name ?? id}
                  </div>
                </div>

                {/* Score + small radar */}
                <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                  {verdict && (
                    <div style={{ textAlign: 'right' }}>
                      <span
                        style={{
                          fontFamily: FONT.grotesque,
                          fontWeight: 800,
                          fontSize: 32,
                          lineHeight: 0.8,
                          color: scoreColor,
                          ...(TNUM as React.CSSProperties),
                        }}
                      >
                        {verdict.score}
                      </span>
                      <Cap
                        color={isActive ? 'rgba(251,250,247,0.5)' : SX.faint}
                        size={7.5}
                        style={{ marginTop: 2 }}
                      >
                        /100 overall
                      </Cap>
                    </div>
                  )}
                  {radarData.length >= 3 && (
                    <div style={{ flex: 'none', width: 60, height: 60 }}>
                      <BigRadar
                        data={radarData}
                        size={60}
                        color={isActive ? SX.paper : bandHex}
                        labels={false}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Summary line */}
              <div
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: isActive ? 'rgba(251,250,247,0.82)' : SX.soft,
                }}
              >
                {verdict?.description ??
                  audience?.shortDefinition ??
                  audience?.coreTension ??
                  ''}
              </div>
            </button>
          )
        })}
      </div>
    </section>
  )
}
