// Verdict resolver — prefers the AS-generated `aggregate.verdict_copy` when
// present (the digest is AS-authored with citations); otherwise builds an
// EXTRACTIVE (not fabricated) fallback from the grounded per-metric data.
// Legacy `aggregate.headline` (a debug string) is detected and ignored.

import type { RunResultPayload, AudienceQuantResult, EvidenceRef } from './types-as'
import { bandFor, bandLabel, type RecBand } from './reception-colors'
import { displayScore } from './metric-direction'

export interface VerdictTakeaway {
  title: string
  body: string
  refs: EvidenceRef[]
}

export interface VerdictMove {
  title: string
  body: string
  quote?: string
  refs: EvidenceRef[]
}

export interface Verdict {
  score: number // 0–100, integer
  band: RecBand
  bandLabel: string
  /** Short punchy H1 (≤ 8 words). */
  headline: string
  /** 1–2 sentence narrative description below the H1. */
  description: string
  /** Structured, cited takeaways (AS-authored or extractive fallback). */
  takeaways: VerdictTakeaway[]
  /** Structured, cited moves (AS-authored; empty if none). */
  moves: VerdictMove[]
  /** Whether the digest came from AS synthesis (vs SP extractive fallback). */
  authored: boolean
}

// Detect the AS legacy debug string so it's never rendered to customers.
const DEBUG_HEADLINE_PATTERN = /^audience quant prediction:/i

function meanScore(results: Record<string, AudienceQuantResult>): number | null {
  // Use reception-positive (display) scores so inverse metrics don't inflate
  // the overall — high risk/effort correctly drags the mean down.
  const scores = Object.entries(results)
    .filter(([, r]) => typeof r.score === 'number')
    .map(([id, r]) => displayScore(id, r.score))
  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function fallbackHeadline(score: number, band: RecBand): string {
  if (band === 'works') return 'Lands — and broadly'
  if (band === 'wobbles') return `Wobbles at ${score}`
  return 'Rejected outright'
}

function fallbackDescription(
  score: number,
  band: RecBand,
  results: Record<string, AudienceQuantResult>,
  metricName: (id: string) => string,
): string {
  const rows = sortedRows(results)
  const weakest = rows[0]
  const strongest = rows[rows.length - 1]
  const tone =
    band === 'works'
      ? 'The audience leans toward this.'
      : band === 'wobbles'
        ? 'Mixed signals across the audience — fixable with proof and framing.'
        : 'The audience pushes back; the issues are structural, not cosmetic.'
  if (weakest && strongest && weakest.id !== strongest.id) {
    return `${tone} ${metricName(strongest.id)} is the standout; ${metricName(weakest.id)} drags it down.`
  }
  return `${bandLabel(band)} at ${score}/100. ${tone}`
}

function sortedRows(results: Record<string, AudienceQuantResult>) {
  return Object.entries(results)
    .map(([id, r]) => ({
      id,
      score: typeof r.score === 'number' ? displayScore(id, r.score) : NaN,
      reasoning: r.reasoning,
    }))
    .filter((r) => Number.isFinite(r.score))
    .sort((a, b) => a.score - b.score)
}

function firstSentence(text: string | undefined): string {
  if (!text) return ''
  const m = text.match(/^[^.!?]*[.!?]/)
  return (m ? m[0] : text).trim()
}

// Extractive fallback — NOT fabricated. Surfaces the most load-bearing metrics
// (the 2 weakest + the strongest if it clears the "works" bar) and uses their
// actual AS reasoning as the body, with a `metric` ref for provenance.
function extractiveTakeaways(
  results: Record<string, AudienceQuantResult>,
  metricName: (id: string) => string,
): VerdictTakeaway[] {
  const rows = sortedRows(results)
  if (rows.length === 0) return []
  const picks: typeof rows = []
  picks.push(...rows.slice(0, 2)) // 2 weakest
  const strong = rows[rows.length - 1]
  if (strong && strong.score >= 52 && rows.length > 2 && !picks.includes(strong)) picks.push(strong)
  return picks.slice(0, 3).map((p) => ({
    title: `${metricName(p.id)} · ${Math.round(p.score)}/100`,
    body: firstSentence(p.reasoning) || `Scored ${Math.round(p.score)}/100 for this audience.`,
    refs: [{ kind: 'metric', id: p.id }],
  }))
}

export function computeVerdict(
  result: RunResultPayload,
  metricName: (id: string) => string,
): Verdict | null {
  const vc = result.aggregate?.verdict_copy
  if (vc) {
    // AS-authored digest. Takeaways/moves carry validated citations.
    const takeaways =
      Array.isArray(vc.takeaways) && vc.takeaways.length > 0
        ? vc.takeaways
        : extractiveTakeaways(result.audience_quant_results, metricName)
    return {
      score: Math.round(vc.overall_score),
      band: vc.band as RecBand,
      bandLabel: bandLabel(vc.band as RecBand),
      headline: vc.headline,
      description: vc.description,
      takeaways,
      moves: Array.isArray(vc.moves) ? vc.moves : [],
      authored: true,
    }
  }

  // Legacy / synthesis-failed run — extractive fallback, never fabricated.
  const mean = meanScore(result.audience_quant_results)
  if (mean == null) return null
  const score = Math.round(mean)
  const band = bandFor(score)

  const legacyHeadline = result.aggregate?.headline?.trim() ?? ''
  const usableLegacy = legacyHeadline && !DEBUG_HEADLINE_PATTERN.test(legacyHeadline)

  return {
    score,
    band,
    bandLabel: bandLabel(band),
    headline: fallbackHeadline(score, band),
    description: usableLegacy
      ? legacyHeadline
      : fallbackDescription(score, band, result.audience_quant_results, metricName),
    takeaways: extractiveTakeaways(result.audience_quant_results, metricName),
    moves: [],
    authored: false,
  }
}
