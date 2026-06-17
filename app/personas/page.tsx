'use client'

import { useEffect, useMemo, useState } from 'react'
import AppHeader from '@/components/AppHeader'
import MiniRadar from '@/components/MiniRadar'
import { useAudiences, accentMap } from '@/lib/personas'
import { SX, FONT, PAGE_W, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { BtnGhost } from '@/components/design/Btn'
import { loadHistory } from '@/lib/history'
import { bandFor, bandLabel, bandColor } from '@/lib/reception-colors'
import { computeVerdict } from '@/lib/aggregate-display'
import type { RunRecord } from '@/lib/store'

interface LastRun {
  score: number
  bandKey: ReturnType<typeof bandFor>
  bandLbl: string
  bandHex: string
  whenAgo: string
  scores: Array<{ id: string; label?: string; score: number }>
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const m = Math.floor(ms / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString()
}

export default function AudiencesPage() {
  const { audiences, loading, error, refresh, quantMetrics } = useAudiences()
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [runsLoaded, setRunsLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false
    loadHistory()
      .then((rs) => {
        if (cancelled) return
        setRuns(rs as RunRecord[])
        setRunsLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setRunsLoaded(true)
      })
    return () => {
      cancelled = true
    }
  }, [])

  // For each audience, find the most recent succeeded/partial run that
  // included it and pull the per-metric scores.
  const lastRunByAudience = useMemo(() => {
    const map = new Map<string, LastRun>()
    const metricName = (id: string) => quantMetrics.find((m) => m.id === id)?.name ?? id
    for (const aud of audiences) {
      const matching = runs.find((r) => {
        if (!r.audience_ids?.includes(aud.id)) return false
        const state = r.per_audience?.[aud.id]
        return state?.status === 'succeeded' && state.result != null
      })
      if (!matching) continue
      const state = matching.per_audience[aud.id]
      if (!state?.result) continue
      const verdict = computeVerdict(state.result, metricName)
      if (!verdict) continue
      const qResults = state.result.audience_quant_results
      const scores = Object.entries(qResults)
        .map(([id, r]) => ({
          id,
          label: metricName(id),
          score: typeof r.score === 'number' ? r.score : 0,
        }))
        .slice(0, 13)
      map.set(aud.id, {
        score: verdict.score,
        bandKey: verdict.band,
        bandLbl: bandLabel(verdict.band),
        bandHex: bandColor(verdict.band),
        whenAgo: formatRelative(matching.updated_at ?? matching.created_at),
        scores,
      })
    }
    return map
  }, [audiences, runs, quantMetrics])

  return (
    <div className="min-h-screen" style={{ background: SX.paper }}>
      <AppHeader />

      <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '56px 48px 96px' }}>
        <div style={{ borderTop: `2px solid ${SX.accent}`, paddingTop: 14, marginBottom: 32 }}>
          <Cap color={SX.accent} size={11}>
            Audience library
          </Cap>
          <h1
            style={{
              margin: '12px 0 12px',
              fontFamily: FONT.grotesque,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: SX.ink,
              lineHeight: 1,
            }}
          >
            Personas.
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: FONT.grotesque,
              fontSize: 14,
              color: SX.soft,
              maxWidth: 560,
              lineHeight: 1.55,
            }}
          >
            Live from Audience Studio · {audiences.length} audience
            {audiences.length === 1 ? '' : 's'} available to this workspace.
          </p>
        </div>

        {loading && (
          <div style={{ color: SX.soft, fontFamily: FONT.grotesque, fontSize: 13 }}>Loading…</div>
        )}

        {error && (
          <div
            style={{
              border: `1px solid ${SX.warn}`,
              background: 'rgba(176,122,18,0.08)',
              padding: 16,
              marginBottom: 16,
              fontFamily: FONT.grotesque,
            }}
          >
            <Cap color={SX.warn} size={10} style={{ marginBottom: 6 }}>
              Could not load audiences
            </Cap>
            <div style={{ fontSize: 13, color: SX.soft }}>{error}</div>
            <div style={{ marginTop: 10 }}>
              <BtnGhost
                onClick={() => {
                  void refresh()
                }}
              >
                Retry
              </BtnGhost>
            </div>
          </div>
        )}

        {!loading && !error && audiences.length === 0 && (
          <div
            style={{
              border: `1px solid ${SX.hair}`,
              padding: 40,
              textAlign: 'center',
              color: SX.soft,
              fontFamily: FONT.grotesque,
              fontSize: 14,
            }}
          >
            No audiences available. Ask your admin to grant access in Audience Studio.
          </div>
        )}

        {audiences.length > 0 && (
          <div
            style={{
              border: `1px solid ${SX.hair}`,
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
            }}
          >
            {audiences.map((audience, i) => {
              const accent = accentMap[audience.accentColor] ?? accentMap.indigo
              const last = lastRunByAudience.get(audience.id)
              const isRightCol = i % 2 === 1
              const isBottomRow = i >= audiences.length - (audiences.length % 2 === 0 ? 2 : 1)
              return (
                <article
                  key={audience.id}
                  className="sx-card-hover"
                  style={{
                    background: SX.paper,
                    padding: 24,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    borderRight: isRightCol ? 'none' : `1px solid ${SX.hair}`,
                    borderBottom: isBottomRow ? 'none' : `1px solid ${SX.hair}`,
                    cursor: 'default',
                  }}
                >
                  {/* Band caps row */}
                  <Cap color={last?.bandHex ?? SX.faint} size={10}>
                    {last ? `${last.bandLbl} · last run ${last.score}/100 · ${last.whenAgo}` : 'No runs yet'}
                  </Cap>

                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        background: accent.avatarBg,
                        color: accent.avatarText,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 24,
                        flexShrink: 0,
                      }}
                      aria-hidden
                    >
                      {audience.emoji}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          fontFamily: FONT.grotesque,
                          fontSize: 22,
                          fontWeight: 800,
                          color: SX.ink,
                          letterSpacing: '-0.02em',
                          lineHeight: 1.15,
                        }}
                      >
                        {audience.name}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontFamily: FONT.grotesque,
                          fontSize: 11,
                          color: SX.faint,
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                          ...TNUM,
                        }}
                      >
                        {audience.personaCount} {audience.personaCount === 1 ? 'persona' : 'personas'}
                      </div>
                    </div>
                  </div>

                  {/* Mini radar of per-metric scores */}
                  {last && last.scores.length >= 3 && (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
                      <MiniRadar scores={last.scores} size={130} />
                    </div>
                  )}

                  {/* Short definition */}
                  {audience.shortDefinition && (
                    <p
                      style={{
                        margin: 0,
                        fontFamily: FONT.grotesque,
                        fontSize: 13,
                        color: SX.soft,
                        lineHeight: 1.5,
                      }}
                    >
                      {audience.shortDefinition}
                    </p>
                  )}

                  {/* Core tension italic callout */}
                  {audience.coreTension && (
                    <div
                      style={{
                        borderLeft: `2px solid ${SX.ink}`,
                        paddingLeft: 12,
                        marginTop: 4,
                      }}
                    >
                      <Cap color={SX.faint} size={9.5} style={{ marginBottom: 4 }}>
                        Core tension
                      </Cap>
                      <div
                        style={{
                          fontFamily: FONT.serif,
                          fontSize: 13.5,
                          fontStyle: 'italic',
                          color: SX.ink,
                          lineHeight: 1.45,
                        }}
                      >
                        {audience.coreTension}
                      </div>
                    </div>
                  )}

                  {!last && runsLoaded && (
                    <div
                      style={{
                        fontFamily: FONT.grotesque,
                        fontSize: 11,
                        color: SX.faint,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                        marginTop: 4,
                      }}
                    >
                      Run a test against this audience to see signals.
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
