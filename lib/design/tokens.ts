// Design tokens for the "Synthetic" UI. Mirrors the SX palette from the
// design handoff bundle (app-shared.jsx). Use these constants in inline
// styles or via CSS variables defined in app/globals.css.
//
// Visual language: "Less & More" — Ink × Vermilion, Archivo, square corners.

export const ACCENT_DEFAULT = '#E5482B' // vermilion

// hex → rgba helper for ghost tints
export function rgba(hex: string, a: number): string {
  const h = hex.replace('#', '')
  const expanded = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(expanded, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`
}

// Palette. `accent` points at a CSS variable so a single setProperty
// re-tints every screen at once.
export const SX = {
  paper: '#FBFAF7',
  ink: '#1A1714',
  soft: '#6B6770',
  faint: '#A8A39B',
  accent: 'var(--sx-accent)',
  accentGhost: 'var(--sx-accent-ghost)',
  accentSoft: 'var(--sx-accent-soft)',
  hair: 'rgba(26,23,20,0.14)',
  hairSoft: 'rgba(26,23,20,0.08)',
  ghost: 'rgba(26,23,20,0.06)',
  tint: '#F4F2EC',
  tint2: '#EEEBE3',
  ok: '#1C8C5B',
  warn: '#B07A12',
  bad: 'var(--sx-accent)',
} as const

// Curated accent options (shared lightness/chroma)
export const SX_ACCENTS = [
  { id: 'vermilion', hex: '#E5482B' },
  { id: 'cobalt', hex: '#2F5BE0' },
  { id: 'emerald', hex: '#1C8C5B' },
  { id: 'plum', hex: '#8A3FD0' },
] as const

// Font stacks (loaded in app/layout.tsx via next/font/google)
export const FONT = {
  grotesque: 'var(--font-archivo), "Archivo", system-ui, sans-serif',
  display: 'var(--font-archivo-black), "Archivo Black", "Archivo", sans-serif',
  serif: 'var(--font-newsreader), "Newsreader", Georgia, serif',
  sans: 'var(--font-dm-sans), "DM Sans", system-ui, sans-serif',
  mono: 'var(--font-dm-mono), "DM Mono", "Menlo", monospace',
} as const

// Tabular lining figures — apply to anything with numbers
export const TNUM: React.CSSProperties = {
  fontVariantNumeric: 'tabular-nums lining-nums',
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
}

// Page wrap width
export const PAGE_W = 1140

// Reception band — overall score → label + color (ink/soft/accent)
export type Band = { k: 'works' | 'wobbles' | 'fails'; label: string; color: string }
export function sxBand(overall: number): Band {
  if (overall >= 52) return { k: 'works', label: 'Works', color: SX.ink }
  if (overall >= 42) return { k: 'wobbles', label: 'Wobbles', color: SX.soft }
  return { k: 'fails', label: 'Fails', color: SX.accent }
}
