'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { RunResultPayload, AudienceQuantResult, QuantMetricMeta, QualModuleMeta, EvidenceRef, ReportChunk } from '@/lib/types-as'
import type { AudienceCard } from '@/lib/personas'
import { SX, FONT, PAGE_W, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import Meter from '@/components/design/Meter'
import Glyphs from '@/components/design/Glyphs'
import { bandFor, bandColor, bandLabel, recHex, type RecBand } from '@/lib/reception-colors'
import { computeVerdict } from '@/lib/aggregate-display'
import { computeConfidence, type SignalConfidence } from '@/lib/confidence'
import ConfidenceReadout from '@/components/report/ConfidenceReadout'
import CitedText from '@/components/report/CitedText'
import { displayScore, displayMetricName } from '@/lib/metric-direction'
import ChapterScaffold from './ChapterScaffold'
import ChapterMenu, { type Chapter } from './ChapterMenu'
import BigRadar from './BigRadar'
import ChatPanel from '@/components/chat/ChatPanel'
import { pickField, severityLabel, humanize } from '@/lib/qualField'
import DetailDrawer, { type DetailPayload } from '@/components/DetailDrawer'

interface Props {
  spRunId: string
  audienceId: string
  audience: AudienceCard | null
  result: RunResultPayload
  quantMetrics: QuantMetricMeta[]
  qualModules: QualModuleMeta[]
}

const CHAPTERS: Chapter[] = [
  { id: 'verdict', n: '01', t: 'Verdict' },
  { id: 'signals', n: '02', t: 'Signals' },
  { id: 'audience', n: '03', t: 'Who we asked' },
  { id: 'evidence', n: '04', t: 'Evidence' },
  { id: 'moves', n: '05', t: 'Moves' },
  { id: 'interrogate', n: '06', t: 'Interrogate' },
]

// ──────────────────────────────────────────────────────────────
// Main Debrief
// ──────────────────────────────────────────────────────────────
export default function Debrief({
  spRunId,
  audienceId,
  audience,
  result,
  quantMetrics,
  qualModules,
}: Props) {
  // Refs to each chapter, used by the chapter menu jump.
  const refs = useRef<Record<string, HTMLElement | null>>({})
  const [activeChap, setActiveChap] = useState('verdict')
  const [progress, setProgress] = useState(0)
  // The detail layer — opened from signal/theme rows (and, in Phase B, citation chips).
  const [drawer, setDrawer] = useState<DetailPayload | null>(null)

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0)
      let cur = 'verdict'
      const triggerY = 56 + 50 + 60 // header + chapter menu + a little
      for (const c of CHAPTERS) {
        const el = refs.current[c.id]
        if (el && el.getBoundingClientRect().top < triggerY) cur = c.id
      }
      setActiveChap(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const goTo = (id: string) => {
    const el = refs.current[id]
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 56 - 50 - 14
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  // citeGo — open the grounded detail for a digest citation. This is the
  // digest→detail link that makes every claim verifiable.
  const citeGo = (ref: EvidenceRef) => {
    if (ref.kind === 'metric') {
      const r = result.audience_quant_results[ref.id]
      if (r) {
        setDrawer({
          kind: 'metric',
          metric: quantMetrics.find((m) => m.id === ref.id),
          result: r,
          stats: result.aggregate?.per_metric?.[ref.id],
          chunks: result.retrieved_chunks,
          axes: weightedAxes,
        })
      } else {
        goTo('signals')
      }
    } else if (ref.kind === 'theme') {
      const out = result.qual_outputs[ref.module_id]
      const items = Array.isArray(out) ? (out as Array<Record<string, unknown>>) : []
      const item = items[ref.theme_index]
      if (item) {
        setDrawer({
          kind: 'theme',
          module: qualModules.find((m) => m.id === ref.module_id),
          item,
        })
      } else {
        goTo('evidence')
      }
    } else if (ref.kind === 'persona') {
      goTo('audience')
    } else if (ref.kind === 'chunk') {
      const chunk = result.retrieved_chunks?.find((c) => c.id === ref.id)
      if (chunk) {
        setDrawer({ kind: 'chunk', chunk })
      } else {
        goTo('evidence')
      }
    } else {
      goTo('evidence')
    }
  }

  const metricNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of quantMetrics) map.set(m.id, displayMetricName(m.id, m.name))
    return (id: string) => map.get(id) ?? displayMetricName(id, id)
  }, [quantMetrics])

  // Human label for a citation chip.
  const refLabel = (ref: EvidenceRef): string => {
    if (ref.kind === 'metric') return metricNameById(ref.id)
    if (ref.kind === 'theme') {
      const mod = qualModules.find((m) => m.id === ref.module_id)
      const out = result.qual_outputs[ref.module_id]
      const items = Array.isArray(out) ? (out as Array<Record<string, unknown>>) : []
      const item = items[ref.theme_index]
      const theme = item ? pickField(item, 'title') : null
      return theme ?? mod?.name ?? 'Theme'
    }
    if (ref.kind === 'persona') return 'Audience'
    return 'Research'
  }

  // Population-weighted behavioural axis values (0–1), weighted by persona
  // sampling weight. Computed once; passed into every metric detail payload.
  const weightedAxes = useMemo(() => {
    const sums: Record<string, { wv: number; w: number }> = {}
    for (const r of result.respondents) {
      const w = r.persona_weight ?? 1
      if (!r.axisValues) continue
      for (const [k, v] of Object.entries(r.axisValues)) {
        const s = sums[k] ?? { wv: 0, w: 0 }
        s.wv += v * w
        s.w += w
        sums[k] = s
      }
    }
    return Object.entries(sums).map(([key, s]) => ({ key, value: s.w > 0 ? s.wv / s.w : 0 }))
  }, [result.respondents])

  const verdict = computeVerdict(result, metricNameById)

  // Tier groups by band
  const tierGroups = useMemo(() => {
    const groups: Record<RecBand, Array<{ id: string; r: AudienceQuantResult; meta?: QuantMetricMeta }>> = {
      works: [],
      wobbles: [],
      fails: [],
    }
    const entries = Object.entries(result.audience_quant_results).map(([id, r]) => ({
      id,
      r,
      meta: quantMetrics.find((m) => m.id === id),
    }))
    // Sort high → low by reception-positive (display) score
    entries.sort((a, b) => displayScore(b.id, b.r.score ?? 0) - displayScore(a.id, a.r.score ?? 0))
    for (const e of entries) {
      if (typeof e.r.score !== 'number') continue
      groups[bandFor(displayScore(e.id, e.r.score))].push(e)
    }
    return groups
  }, [result.audience_quant_results, quantMetrics])

  // Radar shows one spoke per scored metric. We don't aggregate into
  // categories — AS metric `category_id` lookups are unreliable, and the
  // per-metric radar is the canonical view per the user. Score 0 is a
  // legitimate data point (not "missing"), so we keep it on the polygon.
  const radarData = useMemo(() => {
    return Object.entries(result.audience_quant_results)
      .filter(([, r]) => typeof r.score === 'number')
      .map(([id, r]) => ({
        id,
        name: shortLabel(metricNameById(id)),
        value: displayScore(id, r.score as number),
      }))
  }, [result.audience_quant_results, metricNameById])

  // Persona slices derived from respondents
  const personaSlices = useMemo(() => {
    const buckets = new Map<
      string,
      {
        persona_id: string
        name: string
        respondents: number
        axisValues: Record<string, number>
      }
    >()
    // Track the real persona weight per persona (carried on every respondent
    // since the AS run-pipeline enrichment).
    const personaWeights = new Map<string, number>()
    for (const r of result.respondents) {
      const key = r.persona_id
      if (r.persona_weight != null) personaWeights.set(key, r.persona_weight)
      const cur = buckets.get(key) ?? {
        persona_id: r.persona_id,
        name: r.persona_name ?? r.persona_id,
        respondents: 0,
        axisValues: {} as Record<string, number>,
      }
      cur.respondents += 1
      if (r.axisValues) {
        for (const [k, v] of Object.entries(r.axisValues)) {
          cur.axisValues[k] = (cur.axisValues[k] ?? 0) + v
        }
      }
      buckets.set(key, cur)
    }
    const total = result.respondents.length || 1
    return Array.from(buckets.values()).map((b) => {
      const avgAxes: Record<string, number> = {}
      for (const [k, sum] of Object.entries(b.axisValues)) avgAxes[k] = sum / b.respondents
      // Prefer the real persona sampling weight from AS; fall back to the
      // respondent-share in this slice (for legacy runs without enrichment).
      const realWeight = personaWeights.get(b.persona_id)
      return {
        ...b,
        axisValues: avgAxes,
        weight: realWeight ?? b.respondents / total,
        shareOfSlice: b.respondents / total,
        hasRealWeight: realWeight != null,
      }
    })
  }, [result.respondents])

  // Moves — prefer the AS-authored, cited moves on the verdict. Fall back to an
  // extractive scrape of the Recommendations/Push-them-over qual module (no
  // refs available there) for legacy runs / synthesis failures.
  type MoveItem = { n: string; t: string; b: string; q?: string; refs: EvidenceRef[] }
  const moves = useMemo<MoveItem[]>(() => {
    if (verdict?.moves && verdict.moves.length > 0) {
      return verdict.moves.slice(0, 3).map((m, i) => ({
        n: `0${i + 1}`,
        t: m.title,
        b: m.body,
        q: m.quote,
        refs: m.refs,
      }))
    }
    // Extractive fallback — match a recommendations-type module by name.
    const nameCandidates = ['recommendations', 'what would push', 'moves']
    for (const name of nameCandidates) {
      const meta = qualModules.find((m) => m.name.toLowerCase().includes(name))
      if (!meta) continue
      const outKey =
        meta.id in result.qual_outputs
          ? meta.id
          : Object.keys(result.qual_outputs).find(
              (k) => k.toLowerCase().replace(/[_\s]/g, '-').includes(name.replace(/\s+/g, '-')),
            )
      if (!outKey) continue
      const items = extractQualItems(result.qual_outputs[outKey])
      if (items.length === 0) continue
      const moduleId = outKey
      return items.slice(0, 3).map((it, i): MoveItem => {
        const obj = it as Record<string, unknown>
        return {
          n: `0${i + 1}`,
          t: pickField(obj, 'title') ?? `Move ${i + 1}`,
          b: pickField(obj, 'body') ?? pickField(obj, 'mitigation') ?? '',
          q: pickField(obj, 'quote') ?? undefined,
          refs: [{ kind: 'theme', module_id: moduleId, theme_index: i }],
        }
      })
    }
    return []
  }, [verdict, result.qual_outputs, qualModules])

  return (
    <div style={{ background: SX.paper, color: SX.ink, minHeight: 'min-content' }}>
      <ChapterMenu chapters={CHAPTERS} active={activeChap} progress={progress} onJump={goTo} />

      {/* ── 01 VERDICT ── */}
      <section
        ref={(el) => {
          refs.current.verdict = el
        }}
        style={{ position: 'relative', paddingTop: 64 }}
      >
        <div
          style={{
            maxWidth: PAGE_W,
            margin: '0 auto',
            padding: '0 48px',
            position: 'relative',
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              right: 24,
              top: -10,
              fontFamily: FONT.grotesque,
              fontWeight: 800,
              fontSize: 230,
              lineHeight: 0.75,
              letterSpacing: '-0.05em',
              color: SX.ghost,
              zIndex: 0,
              userSelect: 'none',
              pointerEvents: 'none',
              ...(TNUM as React.CSSProperties),
            }}
          >
            01
          </div>
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              borderTop: `2px solid ${SX.accent}`,
              paddingTop: 12,
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <Cap size={11}>
              {audience?.name ?? audienceId}
            </Cap>
            <Cap color={SX.soft} size={10}>
              {result.respondent_count} synthetic respondents · {new Date(result.tested_at).toLocaleDateString()}
            </Cap>
          </div>

          {verdict && (
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                display: 'grid',
                gridTemplateColumns: '1fr 460px',
                gap: 40,
                alignItems: 'center',
                marginTop: 40,
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
                  <span
                    style={{
                      fontFamily: FONT.grotesque,
                      fontWeight: 800,
                      fontSize: 'clamp(72px, 9vw, 120px)',
                      lineHeight: 0.8,
                      letterSpacing: '-0.04em',
                      color: bandColor(verdict.band),
                      flexShrink: 0,
                      ...(TNUM as React.CSSProperties),
                    }}
                  >
                    {verdict.score}
                  </span>
                  <Cap as="span" color={SX.soft} size={12} style={{ maxWidth: 130 }}>
                    out of 100, it{' '}
                    <span style={{ color: bandColor(verdict.band) }}>{verdict.bandLabel}</span>
                  </Cap>
                </div>
                <h1
                  style={{
                    margin: '20px 0 0',
                    fontFamily: FONT.grotesque,
                    fontWeight: 800,
                    fontSize: 'clamp(48px, 6.5vw, 92px)',
                    lineHeight: 0.9,
                    letterSpacing: '-0.04em',
                    color: SX.ink,
                    textWrap: 'balance',
                  }}
                >
                  {verdict.headline || makeDeclineLine(verdict.score, verdict.band)}
                </h1>
                <p
                  style={{
                    margin: '24px 0 0',
                    maxWidth: 600,
                    fontFamily: FONT.serif,
                    fontSize: 18,
                    lineHeight: 1.5,
                    color: SX.ink,
                    fontWeight: 400,
                  }}
                >
                  {verdict.description}
                </p>
              </div>

              {/* Reception radar — one spoke per scored signal, colored by band. */}
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <BigRadar data={radarData} size={420} bandColors />
              </div>
            </div>
          )}

          {/* Three things to know */}
          {verdict && verdict.takeaways.length > 0 && (
            <div
              style={{
                position: 'relative',
                zIndex: 1,
                marginTop: 56,
                borderTop: `1px solid ${SX.accent}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  paddingTop: 12,
                }}
              >
                <Cap size={12}>Three things to know</Cap>
                <Cap color={SX.soft} size={9.5}>
                  If you read nothing else
                </Cap>
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${Math.min(3, verdict.takeaways.length)}, 1fr)`,
                  marginTop: 22,
                }}
              >
                {verdict.takeaways.map((t, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '0 26px 8px',
                      borderLeft: i ? `1px solid ${SX.accent}` : 'none',
                      paddingLeft: i ? 26 : 0,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: FONT.grotesque,
                        fontWeight: 800,
                        fontSize: 38,
                        color: SX.accent,
                        lineHeight: 0.9,
                        ...(TNUM as React.CSSProperties),
                      }}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div
                      style={{
                        fontFamily: FONT.grotesque,
                        fontSize: 17,
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        marginTop: 12,
                        lineHeight: 1.2,
                      }}
                    >
                      {t.title}
                    </div>
                    {t.body && (
                      <div
                        style={{
                          fontFamily: FONT.grotesque,
                          fontSize: 13,
                          color: SX.soft,
                          lineHeight: 1.55,
                          marginTop: 9,
                        }}
                      >
                        {t.body}
                      </div>
                    )}
                    <RefChips refs={t.refs} citeGo={citeGo} refLabel={refLabel} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── 02 SIGNALS ── */}
      <ChapterScaffold
        ref={(el) => {
          refs.current.signals = el
        }}
        chapterNumber="02"
        kicker={`${Object.keys(result.audience_quant_results).length} signals`}
        title="Every dimension, scored."
        note="Each signal is a measured dimension on a 0–100 reception scale, grouped by how it survived contact — what Works, what Wobbles, and what Fails. Tap any signal for the reading behind its score."
      >
        <div style={{ marginTop: 40 }}>
          {(['works', 'wobbles', 'fails'] as RecBand[]).map((k) => {
            const group = tierGroups[k]
            if (group.length === 0) return null
            const col = bandColor(k)
            return (
              <div key={k} style={{ marginTop: 40 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 14,
                    borderBottom: `2px solid ${col}`,
                    paddingBottom: 7,
                  }}
                >
                  <Cap color={col} size={12.5}>
                    {bandLabel(k)}
                  </Cap>
                  <Cap color={SX.soft} size={9} ls="0.06em">
                    {tierBlurb(k)}
                  </Cap>
                  <Cap color={col} size={9.5} style={{ marginLeft: 'auto' }}>
                    {group.length} of {Object.keys(result.audience_quant_results).length}
                  </Cap>
                </div>
                {group.map((g, idx) => (
                  <SignalRow
                    key={g.id}
                    idx={idx + 1 + sumPrev(tierGroups, k)}
                    name={displayMetricName(g.id, g.meta?.name ?? g.id)}
                    score={displayScore(g.id, typeof g.r.score === 'number' ? g.r.score : 0)}
                    band={k}
                    reasoning={g.r.reasoning}
                    confidence={computeConfidence(g.r)}
                    chunks={result.retrieved_chunks}
                    onOpenChunk={(chunk) => setDrawer({ kind: 'chunk', chunk })}
                    onOpenDetail={() =>
                      setDrawer({
                        kind: 'metric',
                        metric: g.meta,
                        result: g.r,
                        stats: result.aggregate?.per_metric?.[g.id],
                        chunks: result.retrieved_chunks,
          axes: weightedAxes,
                      })
                    }
                  />
                ))}
              </div>
            )
          })}
        </div>
      </ChapterScaffold>

      {/* ── 03 WHO WE ASKED ── */}
      <ChapterScaffold
        ref={(el) => {
          refs.current.audience = el
        }}
        chapterNumber="03"
        kicker={`${result.respondent_count} respondents · ${personaSlices.length} household archetype${
          personaSlices.length === 1 ? '' : 's'
        }`}
        title={`${audience?.name ?? audienceId}.`}
        note={audience?.shortDefinition ?? audience?.coreTension ?? ''}
      >
        <div style={{ marginTop: 44 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(4, Math.max(2, personaSlices.length))}, 1fr)`,
              gap: 28,
            }}
          >
            {personaSlices.map((p) => (
              <PersonaCard key={p.persona_id} p={p} />
            ))}
          </div>
        </div>
      </ChapterScaffold>

      {/* ── 04 EVIDENCE ── */}
      <EvidenceChapter
        innerRef={(el) => {
          refs.current.evidence = el
        }}
        qualOutputs={result.qual_outputs}
        qualModules={qualModules}
        onOpenTheme={(item, module) => setDrawer({ kind: 'theme', item, module })}
      />

      {/* ── 05 MOVES ── */}
      <ChapterScaffold
        ref={(el) => {
          refs.current.moves = el
        }}
        chapterNumber="05"
        kicker={moves.length > 0 ? 'What to do next' : 'No moves derived'}
        title={moves.length > 0 ? "What we'd do next." : 'Add Recommendations to surface moves.'}
        note={
          moves.length > 0
            ? `${moves.length} ${moves.length === 1 ? 'move' : 'moves'}, in order — grounded in the evidence above.`
            : 'Moves are derived from the "Recommendations" or "What Would Push Them Over" qual modules. Add either to your Research scope on your next run.'
        }
      >
        {moves.length > 0 ? (
          <div style={{ marginTop: 48 }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${moves.length}, 1fr)`,
                borderTop: `1px solid ${SX.accent}`,
              }}
            >
              {moves.map((mv, i) => (
                <div
                  key={mv.n}
                  style={{
                    padding: '24px 26px 28px',
                    borderLeft: i ? `1px solid ${SX.accent}` : 'none',
                    paddingLeft: i ? 26 : 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: FONT.grotesque,
                      fontWeight: 800,
                      fontSize: 56,
                      color: SX.ghost,
                      lineHeight: 0.8,
                      ...(TNUM as React.CSSProperties),
                    }}
                  >
                    {mv.n}
                  </div>
                  <div
                    style={{
                      fontFamily: FONT.grotesque,
                      fontSize: 18,
                      fontWeight: 700,
                      letterSpacing: '-0.01em',
                      marginTop: 14,
                      lineHeight: 1.18,
                    }}
                  >
                    {mv.t}
                  </div>
                  {mv.b && (
                    <div
                      style={{
                        fontFamily: FONT.grotesque,
                        fontSize: 13.5,
                        color: SX.ink,
                        lineHeight: 1.55,
                        marginTop: 10,
                      }}
                    >
                      {mv.b}
                    </div>
                  )}
                  {mv.q && (
                    <div
                      style={{
                        fontFamily: FONT.serif,
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: SX.soft,
                        lineHeight: 1.5,
                        marginTop: 14,
                        borderTop: `1px solid ${SX.hair}`,
                        paddingTop: 10,
                      }}
                    >
                      &ldquo;{mv.q}&rdquo;
                    </div>
                  )}
                  <RefChips refs={mv.refs} citeGo={citeGo} refLabel={refLabel} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            style={{
              marginTop: 40,
              border: `1px solid ${SX.hair}`,
              padding: '32px 24px',
              textAlign: 'center',
              fontFamily: FONT.grotesque,
              fontSize: 13,
              color: SX.faint,
            }}
          >
            Add the &ldquo;Recommendations&rdquo; or &ldquo;What Would Push Them Over&rdquo; qual
            module to your next test to see concrete moves here.
          </div>
        )}
      </ChapterScaffold>

      {/* ── 06 INTERROGATE ── */}
      <ChapterScaffold
        ref={(el) => {
          refs.current.interrogate = el
        }}
        chapterNumber="06"
        kicker="Chat with the run"
        title="Still have a question? Ask it."
        note="Interrogate the findings or cross-examine a respondent in their own voice."
      >
        <div style={{ marginTop: 32, paddingBottom: 80 }}>
          <ChatPanel
            spRunId={spRunId}
            audienceId={audienceId}
            audienceName={audience?.name ?? null}
            maxRespondents={result.respondent_count}
          />
        </div>
      </ChapterScaffold>

      {/* Detail layer — the receipts. Opened from signal rows + theme rows. */}
      <DetailDrawer open={drawer != null} payload={drawer} onClose={() => setDrawer(null)} onNavigate={setDrawer} />
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Citation chips — render a digest item's refs as click-through provenance.
// ──────────────────────────────────────────────────────────────
function RefChips({
  refs,
  citeGo,
  refLabel,
}: {
  refs: EvidenceRef[]
  citeGo: (ref: EvidenceRef) => void
  refLabel: (ref: EvidenceRef) => string
}) {
  if (!refs || refs.length === 0) return null
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
      {refs.map((ref, i) => (
        <button
          key={i}
          type="button"
          onClick={() => citeGo(ref)}
          className="sx-chip"
          style={{
            cursor: 'pointer',
            background: 'transparent',
            border: `1px solid ${SX.accent}`,
            color: SX.accent,
            fontFamily: FONT.grotesque,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '4px 8px',
            transition: 'background 120ms, color 120ms',
          }}
        >
          {refLabel(ref)} ↗
        </button>
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Persona card (derived from respondents bucketed by persona_id)
// ──────────────────────────────────────────────────────────────
interface PersonaSlice {
  persona_id: string
  name: string
  respondents: number
  axisValues: Record<string, number>
  /** Real persona sampling weight (e.g. 1.6) when AS provided it; otherwise fraction of slice. */
  weight: number
  /** Share of total respondents in this slice (always derivable). */
  shareOfSlice: number
  /** True if `weight` is the real persona archetype weight from AS. */
  hasRealWeight: boolean
}

function PersonaCard({ p }: { p: PersonaSlice }) {
  const [open, setOpen] = useState(false)
  const axes = Object.entries(p.axisValues)
  return (
    <div style={{ borderTop: `2px solid ${open ? SX.accent : SX.ink}` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="sx-row"
        style={{
          display: 'block',
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '16px 18px 20px 0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span
            style={{
              fontFamily: FONT.grotesque,
              fontWeight: 800,
              fontSize: 18,
              letterSpacing: '-0.01em',
              color: SX.ink,
            }}
          >
            {p.name}
          </span>
          {p.hasRealWeight && (
            <span
              title="Persona sampling weight in the audience definition"
              style={{
                fontFamily: FONT.grotesque,
                fontWeight: 800,
                fontSize: 15,
                color: SX.accent,
                ...(TNUM as React.CSSProperties),
              }}
            >
              ×{p.weight.toFixed(2)}
            </span>
          )}
        </div>
        <div
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 12,
            lineHeight: 1.45,
            color: SX.soft,
            marginTop: 6,
          }}
        >
          {p.respondents} of {Math.round(p.respondents / Math.max(p.shareOfSlice, 0.0001))} respondents
        </div>
        {axes.length > 0 && (
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: open ? 9 : 6 }}>
            {(open ? axes : axes.slice(0, 3)).map(([k, v]) => (
              <div key={k}>
                {open && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Cap color={SX.soft} size={8} ls="0.08em">
                      {humanize(k)}
                    </Cap>
                    <Cap color={SX.faint} size={8} ls="0.08em" style={{ ...(TNUM as React.CSSProperties) }}>
                      {v.toFixed(2)}
                    </Cap>
                  </div>
                )}
                <Meter value={v * 100} color={SX.ink} height={2} />
              </div>
            ))}
          </div>
        )}
        <Cap color={SX.accent} size={9} style={{ marginTop: 14 }}>
          {open ? 'Collapse ↑' : 'Hear them ↓'}
        </Cap>
      </button>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Signals — per-metric row
// ──────────────────────────────────────────────────────────────
function SignalRow({
  idx,
  name,
  score,
  band,
  reasoning,
  confidence,
  chunks,
  onOpenChunk,
  onOpenDetail,
}: {
  idx: number
  name: string
  score: number
  band: RecBand
  reasoning?: string
  confidence: SignalConfidence
  chunks?: ReportChunk[]
  onOpenChunk?: (chunk: ReportChunk) => void
  onOpenDetail?: () => void
}) {
  const [open, setOpen] = useState(false)
  const col = bandColor(band)
  return (
    <div style={{ borderBottom: `1px solid ${SX.hair}` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="sx-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '48px 1fr 190px 240px 64px 30px',
          alignItems: 'center',
          gap: 12,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: '16px 8px 16px 0',
        }}
      >
        <Cap color={col} size={10.5} style={{ ...(TNUM as React.CSSProperties) }}>
          {String(idx).padStart(2, '0')}
        </Cap>
        <span
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 16.5,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: SX.ink,
          }}
        >
          {name}
        </span>
        <Cap color={col} size={9.5} ls="0.08em">
          {bandLabel(band)}
        </Cap>
        <Meter value={score} color={recHex(score)} />
        <div
          style={{
            fontFamily: FONT.grotesque,
            fontWeight: 800,
            fontSize: 19,
            color: col,
            textAlign: 'right',
            ...(TNUM as React.CSSProperties),
          }}
        >
          {Math.round(score)}
        </div>
        <Cap color={SX.accent} size={13} style={{ textAlign: 'center' }}>
          {open ? '–' : '+'}
        </Cap>
      </button>
      {open && (
        <div style={{ padding: '4px 0 26px 48px', maxWidth: 820 }}>
          {reasoning && (
            <DetailField k="The reading">
              <span style={{ fontWeight: 700, color: col }}>
                {Math.round(score)} · {bandLabel(band)}.
              </span>{' '}
              <CitedText text={reasoning} chunks={chunks} onCite={onOpenChunk} />
            </DetailField>
          )}
          <DetailField k="Confidence">
            <ConfidenceReadout confidence={confidence} />
          </DetailField>
          {onOpenDetail && (
            <div style={{ borderTop: `1px solid ${SX.hair}`, paddingTop: 12, marginTop: 4 }}>
              <button
                type="button"
                onClick={onOpenDetail}
                className="sx-link"
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <Cap color={SX.accent} size={9.5}>
                  See the evidence behind this →
                </Cap>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DetailField({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '136px 1fr',
        gap: 16,
        padding: '12px 0',
        borderTop: `1px solid ${SX.hair}`,
      }}
    >
      <Cap color={SX.faint} size={9} style={{ paddingTop: 2 }}>
        {k}
      </Cap>
      <div style={{ fontFamily: FONT.grotesque, fontSize: 14, lineHeight: 1.6, color: SX.ink }}>{children}</div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Evidence (qual modules)
// ──────────────────────────────────────────────────────────────
function EvidenceChapter({
  innerRef,
  qualOutputs,
  qualModules,
  onOpenTheme,
}: {
  innerRef: (el: HTMLElement | null) => void
  qualOutputs: Record<string, unknown>
  qualModules: QualModuleMeta[]
  onOpenTheme: (item: Record<string, unknown>, module: QualModuleMeta | undefined) => void
}) {
  const moduleIds = Object.keys(qualOutputs)
  const [activeId, setActiveId] = useState<string>(moduleIds[0] ?? '')
  const themeCount = moduleIds.reduce(
    (s, id) => s + extractQualItems(qualOutputs[id]).length,
    0,
  )
  // Empty state: no qual modules selected for this run. We still render the
  // chapter shell so the chapter menu anchor lands somewhere visible.
  if (moduleIds.length === 0) {
    return (
      <ChapterScaffold
        ref={innerRef as unknown as React.Ref<HTMLElement>}
        chapterNumber="04"
        kicker="0 modules selected"
        title="No qual evidence this run."
        note="Add qual modules in Research scope on your next test to see audience themes, quotes and risks here."
      >
        <div
          style={{
            marginTop: 40,
            border: `1px solid ${SX.hair}`,
            padding: '32px 24px',
            textAlign: 'center',
            fontFamily: FONT.grotesque,
            fontSize: 13,
            color: SX.faint,
          }}
        >
          Pick at least one qual module — &ldquo;What Lands&rdquo;, &ldquo;Key Risk&rdquo;,
          &ldquo;Recommendations&rdquo;, etc. — to populate this section.
        </div>
      </ChapterScaffold>
    )
  }
  const items = extractQualItems(qualOutputs[activeId])
  const moduleName = (id: string) => qualModules.find((m) => m.id === id)?.name ?? id

  return (
    <ChapterScaffold
      ref={innerRef as unknown as React.Ref<HTMLElement>}
      chapterNumber="04"
      kicker={`${themeCount} coded themes · ${moduleIds.length} ${moduleIds.length === 1 ? 'module' : 'modules'}`}
      title="In their own words."
      note="Headlines and prevalence first. The full finding, the respondent&rsquo;s own words, and who it affects unfold on tap."
    >
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {moduleIds.map((id) => {
            const on = activeId === id
            const count = extractQualItems(qualOutputs[id]).length
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveId(id)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  border: `1px solid ${on ? SX.ink : SX.hair}`,
                  background: on ? SX.ink : 'transparent',
                  color: on ? SX.paper : SX.soft,
                  padding: '8px 12px 9px',
                  fontFamily: FONT.grotesque,
                  transition: 'background 120ms, color 120ms, border-color 120ms',
                }}
              >
                <span style={{ fontSize: 9, color: on ? SX.accent : SX.accent }} aria-hidden>
                  ◆
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  {moduleName(id)}
                </span>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 800,
                    ...(TNUM as React.CSSProperties),
                  }}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ marginTop: 22, borderTop: `2px solid ${SX.ink}` }}>
          {items.map((raw, i) => (
            <ThemeRow
              key={i}
              item={raw as Record<string, unknown>}
              onOpen={() =>
                onOpenTheme(
                  raw as Record<string, unknown>,
                  qualModules.find((m) => m.id === activeId),
                )
              }
            />
          ))}
          {items.length === 0 && (
            <div
              style={{
                padding: '24px 0',
                fontFamily: FONT.grotesque,
                fontSize: 13,
                color: SX.faint,
              }}
            >
              No themes for this module.
            </div>
          )}
        </div>
      </div>
    </ChapterScaffold>
  )
}

function ThemeRow({ item, onOpen }: { item: Record<string, unknown>; onOpen?: () => void }) {
  const [open, setOpen] = useState(false)
  // Use the semantic field mapping (lib/qualField.ts) — AS qual modules emit
  // theme_name / explanation / strategic_severity / representative_quote /
  // affected_audience_slices / intensity_or_prevalence / etc.
  const title = pickField(item, 'title') ?? 'Theme'
  const body = pickField(item, 'body') ?? ''
  const quote = pickField(item, 'quote')
  const affects = pickField(item, 'affected')
  // AS qual modules return severity as a long descriptive paragraph
  // (e.g. "HIGH. This is the only positive theme appearing across…").
  // Strip everything after the first delimiter to get just the label.
  const sevFull = pickField(item, 'severity')
  const sev = severityLabel(sevFull)
  // Keep the long descriptive sentence as additional body text below.
  const sevDescription =
    sevFull && sev && sevFull.length > sev.length + 2
      ? sevFull.slice(sev.length).replace(/^[\s—\-:|.]+/, '').trim()
      : null
  // Prevalence can be a number, or a phrase like "9/12" or "9 of 12 respondents".
  const prevalenceRaw =
    item.prevalence ?? item.n_respondents ?? item.count ?? item.intensity_or_prevalence
  const prevalence = (() => {
    if (typeof prevalenceRaw === 'number') return prevalenceRaw
    if (typeof prevalenceRaw === 'string') {
      const m = prevalenceRaw.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i)
      if (m) return parseInt(m[1], 10)
      const n = parseInt(prevalenceRaw, 10)
      if (!Number.isNaN(n)) return n
    }
    return 0
  })()

  return (
    <div style={{ borderBottom: `1px solid ${SX.hair}` }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="sx-row"
        style={{
          display: 'grid',
          gridTemplateColumns: '92px 1fr 190px 30px',
          alignItems: 'center',
          gap: 16,
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          background: 'transparent',
          border: 'none',
          padding: '17px 8px 17px 0',
        }}
      >
        <div>
          {sev ? (
            <SeverityPill sev={sev} />
          ) : (
            <Cap color={SX.faint} size={9}>
              —
            </Cap>
          )}
        </div>
        <span
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 16,
            fontWeight: 700,
            letterSpacing: '-0.01em',
            color: SX.ink,
            lineHeight: 1.25,
          }}
        >
          {title}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
          {prevalence > 0 ? <Dots n={prevalence} of={12} /> : null}
          {prevalence > 0 && (
            <Cap color={SX.soft} size={9.5} style={{ width: 40, textAlign: 'right' }}>
              {prevalence}/12
            </Cap>
          )}
        </div>
        <Cap color={SX.accent} size={13} style={{ textAlign: 'center' }}>
          {open ? '–' : '+'}
        </Cap>
      </button>
      {open && (
        <div style={{ padding: '0 0 24px 92px', maxWidth: 800 }}>
          {body && (
            <div
              style={{
                fontFamily: FONT.grotesque,
                fontSize: 14.5,
                lineHeight: 1.6,
                color: SX.ink,
                maxWidth: 640,
              }}
            >
              {body}
            </div>
          )}
          {sevDescription && (
            <div
              style={{
                marginTop: body ? 14 : 0,
                paddingTop: body ? 12 : 0,
                borderTop: body ? `1px dashed ${SX.hair}` : 'none',
                fontFamily: FONT.grotesque,
                fontSize: 12.5,
                lineHeight: 1.55,
                color: SX.soft,
                maxWidth: 640,
              }}
            >
              <Cap color={SX.faint} size={9} style={{ marginBottom: 6 }}>
                Why {sev?.toLowerCase()}
              </Cap>
              {sevDescription}
            </div>
          )}
          {quote && (
            <div
              style={{
                margin: '16px 0 0',
                borderTop: `1px solid ${SX.hair}`,
                borderBottom: `1px solid ${SX.hair}`,
                padding: '14px 0',
              }}
            >
              <div
                style={{
                  fontFamily: FONT.serif,
                  fontStyle: 'italic',
                  fontSize: 16.5,
                  lineHeight: 1.5,
                  color: SX.ink,
                  maxWidth: 640,
                }}
              >
                &ldquo;{quote}&rdquo;
              </div>
              {affects && (
                <Cap color={SX.faint} size={9} style={{ marginTop: 8 }}>
                  Affects · {affects}
                </Cap>
              )}
            </div>
          )}
          {onOpen && (
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                onClick={onOpen}
                className="sx-link"
                style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
              >
                <Cap color={SX.accent} size={9.5}>
                  See the full theme detail →
                </Cap>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function SeverityPill({ sev }: { sev: string }) {
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
        padding: '2px 6px 3px',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      {sev}
    </span>
  )
}

function Dots({ n, of = 12 }: { n: number; of?: number }) {
  return (
    <div style={{ display: 'flex', gap: 3 }} title={`${n} of ${of} respondents`}>
      {Array.from({ length: of }).map((_, i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            display: 'inline-block',
            background: i < n ? SX.accent : SX.hair,
          }}
        />
      ))}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function extractQualItems(out: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(out)) return out as Array<Record<string, unknown>>
  if (out && typeof out === 'object') {
    const obj = out as Record<string, unknown>
    if (Array.isArray(obj.items)) return obj.items as Array<Record<string, unknown>>
    const { module_id: _m, items: _i, ...rest } = obj
    void _m
    void _i
    if (Object.keys(rest).length > 0) return [rest]
  }
  return []
}

function tierBlurb(band: RecBand): string {
  return band === 'works'
    ? 'Understood, believed, liked enough — keep.'
    : band === 'wobbles'
    ? 'Mixed — fixable with proof and framing.'
    : 'Rejected outright — structural, not cosmetic.'
}

function sumPrev(
  groups: Record<RecBand, unknown[]>,
  band: RecBand,
): number {
  const order: RecBand[] = ['works', 'wobbles', 'fails']
  let n = 0
  for (const k of order) {
    if (k === band) break
    n += groups[k].length
  }
  return n
}

function makeDeclineLine(score: number, band: RecBand): string {
  if (band === 'works') return 'Lands — and broadly.'
  if (band === 'wobbles') return `Wobbles at ${score}.`
  return 'Rejected.'
}

function shortLabel(name: string): string {
  // Compress long metric names for radar labels
  if (name.length <= 16) return name
  return name.split(' ').slice(0, 2).join(' ')
}
