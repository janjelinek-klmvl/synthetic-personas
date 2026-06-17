// Reception color scale — used in score bars, gauges, and the verdict band.
// Maps a 0–100 score onto a warm rose → amber → green ramp, matching the
// design handoff bundle.

import { SX } from './design/tokens'

// Three named band buckets — drives band labels and primary fills.
export type RecBand = 'fails' | 'wobbles' | 'works'

export function bandFor(score: number): RecBand {
  if (score >= 52) return 'works'
  if (score >= 42) return 'wobbles'
  return 'fails'
}

export function bandLabel(band: RecBand): string {
  return band === 'works' ? 'Works' : band === 'wobbles' ? 'Wobbles' : 'Fails'
}

export function bandColor(band: RecBand): string {
  // Works = ok green; Wobbles = warn amber; Fails = accent (vermilion).
  return band === 'works' ? SX.ok : band === 'wobbles' ? SX.warn : SX.accent
}

// Smooth color along the 0–100 ramp for bars / mini-radars.
// Interpolates between vermilion (0), amber (50), green (100).
export function recHex(score: number): string {
  const s = Math.max(0, Math.min(100, score))
  if (s < 50) {
    // vermilion → amber
    const t = s / 50
    return mix('#E5482B', '#B07A12', t)
  }
  // amber → green
  const t = (s - 50) / 50
  return mix('#B07A12', '#1C8C5B', t)
}

function mix(a: string, b: string, t: number): string {
  const pa = hexToRgb(a)
  const pb = hexToRgb(b)
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t)
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t)
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t)
  return `rgb(${r}, ${g}, ${bl})`
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
