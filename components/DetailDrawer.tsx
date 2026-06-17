'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { AudienceQuantResult, MetricRunAggregate, QualModuleMeta, QuantMetricMeta, ReportChunk } from '@/lib/types-as'
import { humanize, pickField, remainingFields, severityLabel } from '@/lib/qualField'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import { bandFor, bandColor, bandLabel, recHex } from '@/lib/reception-colors'
import { computeConfidence } from '@/lib/confidence'
import Cap from '@/components/design/Cap'
import Meter from '@/components/design/Meter'
import ConfidenceReadout from '@/components/report/ConfidenceReadout'
import CitedText from '@/components/report/CitedText'
import { displayScore, displayMetricName } from '@/lib/metric-direction'

export type DetailPayload =
  | {
      kind: 'metric'
      metric: QuantMetricMeta | undefined
      result: AudienceQuantResult
      stats?: NonNullable<MetricRunAggregate['per_metric']>[string]
      /** All retrieved chunks for the run — used to resolve citation receipts. */
      chunks?: ReportChunk[]
      /** Population-weighted behavioural axis values (0–1), for the dispositions meters. */
      axes?: Array<{ key: string; value: number }>
    }
  | {
      kind: 'theme'
      module: QualModuleMeta | undefined
      item: Record<string, unknown>
    }
  | {
      kind: 'chunk'
      chunk: ReportChunk
    }

interface Props {
  open: boolean
  payload: DetailPayload | null
  onClose: () => void
  /** Navigate the drawer to a new payload (e.g. an inline citation → chunk). */
  onNavigate?: (payload: DetailPayload) => void
}

export default function DetailDrawer({ open, payload, onClose, onNavigate }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (typeof window === 'undefined') return null
  if (!open || !payload) return null

  return createPortal(
    <div style={overlayStyle} onClick={onClose}>
      <aside style={panelStyle} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        {payload.kind === 'metric' ? (
          <MetricDrawer payload={payload} onClose={onClose} onNavigate={onNavigate} />
        ) : payload.kind === 'theme' ? (
          <ThemeDrawer payload={payload} onClose={onClose} />
        ) : (
          <ChunkDrawer payload={payload} onClose={onClose} />
        )}
      </aside>
    </div>,
    document.body,
  )
}

// ── Metric drawer ─────────────────────────────────────────────
function MetricDrawer({
  payload,
  onClose,
  onNavigate,
}: {
  payload: Extract<DetailPayload, { kind: 'metric' }>
  onClose: () => void
  onNavigate?: (payload: DetailPayload) => void
}) {
  const { metric, result, stats, chunks, axes } = payload
  const rawScore = typeof result.score === 'number' ? result.score : null
  // Reception-positive (display) score — inverse metrics show 100 − raw.
  const score = rawScore != null ? displayScore(result.metric_id, rawScore) : null
  const band = score != null ? bandFor(score) : null
  const col = band ? bandColor(band) : SX.ink
  const evidence = resolveEvidence(result.research_evidence_cited, chunks)
  const confidence = computeConfidence(result, { evidenceCount: evidence.length })
  // Order axes load-bearing first: an axis is load-bearing if its key (or
  // humanised label) appears in the axis_logic prose; earliest mention wins.
  const orderedAxes = orderAxesByLogic(axes, result.axis_logic)

  return (
    <>
      {/* Sticky header */}
      <div style={stickyHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px 0' }}>
          <Cap size={10}>Signal evidence</Cap>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close">
            ×
          </button>
        </div>
        <div style={{ padding: '8px 26px 18px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ minWidth: 0 }}>
              <Cap color={SX.accent} size={9.5}>
                {metric?.name ? 'Understanding' : 'Signal'}
              </Cap>
              <h2
                style={{
                  margin: '8px 0 0',
                  fontFamily: FONT.grotesque,
                  fontWeight: 800,
                  fontSize: 30,
                  letterSpacing: '-0.025em',
                  lineHeight: 1,
                  color: SX.ink,
                }}
              >
                {displayMetricName(result.metric_id, metric?.name ?? result.metric_id)}
              </h2>
              {band && (
                <Cap color={col} size={10} style={{ marginTop: 8 }}>
                  {bandLabel(band)}
                </Cap>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <span
                style={{
                  fontFamily: FONT.grotesque,
                  fontWeight: 800,
                  fontSize: 56,
                  lineHeight: 0.78,
                  color: col,
                  ...(TNUM as React.CSSProperties),
                }}
              >
                {score ?? '—'}
              </span>
              <Cap color={SX.faint} size={8} style={{ marginTop: 4 }}>
                of 100 · {confidence.overallLabel.toLowerCase()}
              </Cap>
            </div>
          </div>
          {score != null && <Meter value={score} color={recHex(score)} style={{ marginTop: 14 }} />}
        </div>
      </div>

      <div style={bodyStyle}>
        {metric?.definition && (
          <DrawerSection k="What this metric measures">
            <Prose muted>{metric.definition}</Prose>
          </DrawerSection>
        )}

        <DrawerSection k="Confidence" sub="how much to trust this">
          <ConfidenceReadout confidence={confidence} />
        </DrawerSection>

        {result.reasoning && (
          <DrawerSection k="The reading" sub="why this score">
            <Prose>
              <CitedText
                text={result.reasoning}
                chunks={chunks}
                onCite={(c) => onNavigate?.({ kind: 'chunk', chunk: c })}
              />
            </Prose>
          </DrawerSection>
        )}

        {(orderedAxes.length > 0 || result.axis_logic) && (
          <DrawerSection k="How dispositions shaped it" sub="population-weighted">
            {orderedAxes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: result.axis_logic ? 16 : 0 }}>
                {orderedAxes.map((a, i) => {
                  const lead = i === 0 && a.loadBearing
                  return (
                    <div key={a.key}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: 4,
                        }}
                      >
                        <Cap color={lead ? SX.accent : SX.ink} size={9}>
                          {humanize(a.key)}
                          {lead ? ' · load-bearing' : ''}
                        </Cap>
                        <Cap color={SX.faint} size={8.5} style={{ ...(TNUM as React.CSSProperties) }}>
                          {Math.round(a.value * 100)}
                        </Cap>
                      </div>
                      <Meter value={a.value * 100} color={lead ? SX.accent : SX.ink} height={lead ? 4 : 2} />
                    </div>
                  )
                })}
              </div>
            )}
            {result.axis_logic && (
              <div
                style={
                  orderedAxes.length > 0
                    ? { paddingTop: 14, borderTop: `1px dashed ${SX.hair}` }
                    : undefined
                }
              >
                <Prose muted>{result.axis_logic}</Prose>
              </div>
            )}
          </DrawerSection>
        )}

        {evidence.length > 0 && (
          <DrawerSection k="Research evidence cited" sub={`${evidence.length} ${evidence.length === 1 ? 'source' : 'sources'}`}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {evidence.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '11px 0',
                    borderTop: i ? `1px solid ${SX.hair}` : 'none',
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.grotesque,
                      fontWeight: 800,
                      fontSize: 11,
                      color: SX.accent,
                      flex: 'none',
                      width: 18,
                      ...(TNUM as React.CSSProperties),
                    }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    {s.source && (
                      <Cap color={SX.accent} size={8.5} style={{ marginBottom: 4 }}>
                        {s.source}
                      </Cap>
                    )}
                    <div style={{ fontFamily: FONT.grotesque, fontSize: 12.5, lineHeight: 1.5, color: SX.ink }}>
                      {s.text}
                    </div>
                    {s.note && (
                      <div
                        style={{
                          fontFamily: FONT.grotesque,
                          fontSize: 11,
                          fontStyle: 'italic',
                          color: SX.faint,
                          marginTop: 4,
                        }}
                      >
                        {s.note}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </DrawerSection>
        )}

        {stats && (typeof stats.mean === 'number' || typeof stats.n === 'number') && (
          <DrawerSection k="Distribution">
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              {typeof stats.mean === 'number' && <Stat label="Mean" value={stats.mean.toFixed(1)} />}
              {typeof stats.median === 'number' && <Stat label="Median" value={stats.median.toFixed(1)} />}
              {typeof stats.stddev === 'number' && <Stat label="Std dev" value={stats.stddev.toFixed(1)} />}
              {typeof stats.n === 'number' && <Stat label="n" value={String(stats.n)} />}
            </div>
          </DrawerSection>
        )}
      </div>
    </>
  )
}

// ── Theme drawer ──────────────────────────────────────────────
function ThemeDrawer({
  payload,
  onClose,
}: {
  payload: Extract<DetailPayload, { kind: 'theme' }>
  onClose: () => void
}) {
  const { item, module } = payload
  const title = pickField(item, 'title') ?? module?.name ?? 'Theme'
  const sevRaw = pickField(item, 'severity')
  const sev = severityLabel(sevRaw)
  const body = pickField(item, 'body')
  const quote = pickField(item, 'quote')
  const evidence = pickField(item, 'evidence')
  const affected = pickField(item, 'affected')
  const mitigation = pickField(item, 'mitigation')
  const extras = remainingFields(item, ['title', 'severity', 'body', 'quote', 'evidence', 'affected', 'mitigation'])

  return (
    <>
      <div style={stickyHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px 0' }}>
          <Cap size={10}>Theme detail</Cap>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close">
            ×
          </button>
        </div>
        <div style={{ padding: '8px 26px 18px' }}>
          {module?.name && (
            <Cap color={SX.accent} size={9.5}>
              {module.name}
            </Cap>
          )}
          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: FONT.grotesque,
              fontWeight: 800,
              fontSize: 26,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
              color: SX.ink,
            }}
          >
            {title}
          </h2>
          {sev && (
            <div style={{ marginTop: 10 }}>
              <SeverityChip sev={sev} />
            </div>
          )}
        </div>
      </div>

      <div style={bodyStyle}>
        {body && (
          <DrawerSection k="What this means">
            <Prose>{body}</Prose>
          </DrawerSection>
        )}
        {quote && (
          <DrawerSection k="In their own words">
            <div
              style={{
                fontFamily: FONT.serif,
                fontStyle: 'italic',
                fontSize: 16.5,
                lineHeight: 1.5,
                color: SX.ink,
              }}
            >
              &ldquo;{quote.replace(/^['"“”]|['"“”]$/g, '')}&rdquo;
            </div>
          </DrawerSection>
        )}
        {affected && (
          <DrawerSection k="Who's affected">
            <Prose muted>{affected}</Prose>
          </DrawerSection>
        )}
        {evidence && (
          <DrawerSection k="Where this shows up">
            <Prose muted>{evidence}</Prose>
          </DrawerSection>
        )}
        {mitigation && (
          <DrawerSection k="What to do">
            <Prose>{mitigation}</Prose>
          </DrawerSection>
        )}
        {extras.length > 0 && (
          <DrawerSection k="More fields">
            {extras.map(([k, v]) => (
              <div key={k} style={{ marginTop: 8 }}>
                <Cap color={SX.faint} size={8.5}>
                  {humanize(k)}
                </Cap>
                <div style={{ fontFamily: FONT.grotesque, fontSize: 13, color: SX.soft, lineHeight: 1.5, marginTop: 2 }}>
                  {v}
                </div>
              </div>
            ))}
          </DrawerSection>
        )}
      </div>
    </>
  )
}

// ── Chunk drawer (a single research passage, opened from inline citations) ──
function ChunkDrawer({
  payload,
  onClose,
}: {
  payload: Extract<DetailPayload, { kind: 'chunk' }>
  onClose: () => void
}) {
  const { chunk } = payload
  return (
    <>
      <div style={stickyHeaderStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 26px 0' }}>
          <Cap size={10}>Research passage</Cap>
          <button type="button" onClick={onClose} style={closeBtnStyle} aria-label="Close">
            ×
          </button>
        </div>
        <div style={{ padding: '8px 26px 18px' }}>
          <Cap color={SX.accent} size={9.5}>
            {chunk.source_title}
          </Cap>
          <h2
            style={{
              margin: '8px 0 0',
              fontFamily: FONT.grotesque,
              fontWeight: 800,
              fontSize: 24,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: SX.ink,
            }}
          >
            {chunk.topic}
          </h2>
        </div>
      </div>
      <div style={bodyStyle}>
        <DrawerSection k="The passage">
          <Prose>{chunk.content}</Prose>
        </DrawerSection>
      </div>
    </>
  )
}

// ── Shared atoms ──────────────────────────────────────────────
function DrawerSection({ k, sub, children }: { k: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ padding: '20px 26px', borderTop: `1px solid ${SX.hair}` }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Cap color={SX.faint} size={9.5}>
          {k}
        </Cap>
        {sub && (
          <Cap color={SX.faint} size={8.5}>
            {sub}
          </Cap>
        )}
      </div>
      <div style={{ marginTop: 12 }}>{children}</div>
    </div>
  )
}

function Prose({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  return (
    <div
      style={{
        fontFamily: FONT.grotesque,
        fontSize: muted ? 13.5 : 14,
        lineHeight: 1.62,
        color: muted ? SX.soft : SX.ink,
      }}
    >
      {children}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <Cap color={SX.faint} size={8.5}>
        {label}
      </Cap>
      <div
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 20,
          fontWeight: 800,
          color: SX.ink,
          marginTop: 4,
          ...(TNUM as React.CSSProperties),
        }}
      >
        {value}
      </div>
    </div>
  )
}

function SeverityChip({ sev }: { sev: string }) {
  const v = sev.toLowerCase()
  const crit = v.includes('critical')
  const hot = crit || v.includes('high')
  const c = hot ? SX.accent : SX.soft
  return (
    <span
      style={{
        fontFamily: FONT.grotesque,
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: crit ? SX.paper : c,
        background: crit ? SX.accent : 'transparent',
        border: `1px solid ${c}`,
        padding: '3px 8px 4px',
        display: 'inline-block',
      }}
    >
      {sev}
    </span>
  )
}

// Order axes so the load-bearing one (named earliest in axis_logic) is first.
function orderAxesByLogic(
  axes: Array<{ key: string; value: number }> | undefined,
  axisLogic: string | undefined,
): Array<{ key: string; value: number; loadBearing: boolean }> {
  if (!axes || axes.length === 0) return []
  const logic = (axisLogic ?? '').toLowerCase()
  const mentionIndex = (key: string): number => {
    const candidates = [key.toLowerCase(), humanize(key).toLowerCase()]
    let best = Infinity
    for (const c of candidates) {
      const idx = logic.indexOf(c)
      if (idx >= 0 && idx < best) best = idx
    }
    return best
  }
  const scored = axes.map((a) => ({ ...a, mention: mentionIndex(a.key) }))
  const anyMentioned = scored.some((a) => a.mention < Infinity)
  scored.sort((a, b) => {
    if (a.mention !== b.mention) return a.mention - b.mention
    return b.value - a.value // tiebreak: stronger disposition first
  })
  return scored.map((a, i) => ({
    key: a.key,
    value: a.value,
    loadBearing: anyMentioned && i === 0 && a.mention < Infinity,
  }))
}

interface Receipt {
  text: string // the actual research passage (or the model's prose for legacy runs)
  source?: string // source title + topic
  note?: string // the model's note on why it's load-bearing
}

// Resolve research_evidence_cited into receipts. New runs: {chunk_id, note}[]
// resolved against the real retrieved chunks → shows the actual passage +
// source. Legacy runs: string[] / string of the model's prose.
function resolveEvidence(raw: unknown, chunks?: ReportChunk[]): Receipt[] {
  if (!raw) return []
  const byId = new Map<string, ReportChunk>((chunks ?? []).map((c) => [c.id, c]))
  const arr = Array.isArray(raw) ? raw : [raw]
  const out: Receipt[] = []
  for (const e of arr) {
    if (typeof e === 'string') {
      if (e.trim()) out.push({ text: e.trim() })
      continue
    }
    if (e && typeof e === 'object') {
      const o = e as Record<string, unknown>
      const chunkId = typeof o.chunk_id === 'string' ? o.chunk_id : null
      const note = typeof o.note === 'string' ? o.note : undefined
      const chunk = chunkId ? byId.get(chunkId) : undefined
      if (chunk) {
        out.push({
          text: chunk.content,
          source: `${chunk.source_title} — ${chunk.topic}`,
          note,
        })
      } else if (note) {
        out.push({ text: note }) // chunk not in payload — fall back to the note
      } else if (chunkId) {
        out.push({ text: chunkId })
      }
    }
  }
  return out
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(26,23,20,0.34)',
  zIndex: 1000,
  display: 'flex',
  justifyContent: 'flex-end',
}

const panelStyle: React.CSSProperties = {
  background: SX.paper,
  width: 'min(580px, 94vw)',
  height: '100%',
  borderLeft: `1px solid ${SX.ink}`,
  boxShadow: '-24px 0 60px rgba(26,23,20,0.22)',
  display: 'flex',
  flexDirection: 'column',
  overflowY: 'auto',
  animation: 'detailDrawerSlide 200ms ease-out',
}

const stickyHeaderStyle: React.CSSProperties = {
  position: 'sticky',
  top: 0,
  background: SX.paper,
  borderBottom: `1px solid ${SX.ink}`,
  zIndex: 2,
}

const bodyStyle: React.CSSProperties = {
  flex: 1,
}

const closeBtnStyle: React.CSSProperties = {
  cursor: 'pointer',
  border: 'none',
  background: 'transparent',
  fontFamily: FONT.grotesque,
  fontSize: 22,
  lineHeight: 1,
  color: SX.soft,
  padding: '0 2px',
}
