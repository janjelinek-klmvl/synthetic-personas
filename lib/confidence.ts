// Per-signal confidence — replaces the model's near-constant "uncertainty"
// self-rating with a computed reading built from two transparent pillars:
//   1. Backed by data — how many research sources the score cites.
//   2. Model certainty — the model's own self-rating (uncertainty, inverted).
// The model rating is near-constant ("medium") across runs, so evidence is
// weighted higher — that's what makes the result actually vary per signal.

import type { AudienceQuantResult } from './types-as'

export type Level = 'low' | 'moderate' | 'high'

export interface SignalConfidence {
  evidenceCount: number
  evidence: Level
  evidenceLabel: string // 'Thin' | 'Moderate' | 'Strong'
  modelRated: boolean
  model: Level
  modelLabel: string // 'Low' | 'Moderate' | 'High' | 'Not rated'
  /** The model's raw self-rated uncertainty word, if present (for the honest footnote). */
  modelRaw: string | null
  overall: Level
  overallLabel: string // 'Low confidence' | 'Moderate confidence' | 'High confidence'
  score01: number
}

// ── Tunables ──────────────────────────────────────────────────
const EVIDENCE_THIN_MAX = 2 // <=2 sources → Thin
const EVIDENCE_STRONG_MIN = 6 // >=6 sources → Strong (3–5 → Moderate)
const WEIGHT_EVIDENCE = 0.6
const WEIGHT_MODEL = 0.4
const BAND_HIGH = 0.66
const BAND_MODERATE = 0.4

const clamp01 = (n: number) => Math.max(0, Math.min(1, n))

export function countEvidence(raw: AudienceQuantResult['research_evidence_cited']): number {
  if (!raw) return 0
  if (typeof raw === 'string') return raw.trim() ? 1 : 0
  if (Array.isArray(raw)) {
    return raw.filter((e) => {
      if (typeof e === 'string') return e.trim().length > 0
      return e != null
    }).length
  }
  return 0
}

function bandFromScore01(s: number): Level {
  if (s >= BAND_HIGH) return 'high'
  if (s >= BAND_MODERATE) return 'moderate'
  return 'low'
}

export function computeConfidence(
  result: AudienceQuantResult,
  opts?: { evidenceCount?: number },
): SignalConfidence {
  const n = opts?.evidenceCount ?? countEvidence(result.research_evidence_cited)

  // Pillar 1 — backed by data.
  const evidence01 = clamp01((n - 1) / 6) // n=1→0, n>=7→1
  const evidence: Level = n <= EVIDENCE_THIN_MAX ? 'low' : n >= EVIDENCE_STRONG_MIN ? 'high' : 'moderate'
  const evidenceLabel = evidence === 'high' ? 'Strong' : evidence === 'moderate' ? 'Moderate' : 'Thin'

  // Pillar 2 — model self-certainty (inverse of reported uncertainty).
  const rawWord = typeof result.uncertainty === 'string' ? result.uncertainty.trim().toLowerCase() : ''
  const modelRated = rawWord === 'low' || rawWord === 'medium' || rawWord === 'high'
  const model01 = rawWord === 'low' ? 1.0 : rawWord === 'high' ? 0.0 : 0.5
  const model: Level = rawWord === 'low' ? 'high' : rawWord === 'high' ? 'low' : 'moderate'
  const modelLabel = !modelRated ? 'Not rated' : model === 'high' ? 'High' : model === 'moderate' ? 'Moderate' : 'Low'

  // Combine — model omitted when absent.
  const score01 = modelRated
    ? clamp01(WEIGHT_EVIDENCE * evidence01 + WEIGHT_MODEL * model01)
    : evidence01
  const overall = bandFromScore01(score01)
  const overallLabel =
    overall === 'high' ? 'High confidence' : overall === 'moderate' ? 'Moderate confidence' : 'Low confidence'

  return {
    evidenceCount: n,
    evidence,
    evidenceLabel,
    modelRated,
    model,
    modelLabel,
    modelRaw: modelRated ? rawWord : null,
    overall,
    overallLabel,
    score01,
  }
}
