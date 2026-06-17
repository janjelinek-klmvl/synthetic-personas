'use client'

import { SX } from '@/lib/design/tokens'
import { recHex } from '@/lib/reception-colors'

interface Props {
  // List of per-metric scores (0–100). One spoke per entry. Order matters.
  scores: Array<{ id: string; label?: string; score: number }>
  size?: number
  fill?: string
}

// Mini radar / spider chart. One spoke per metric (NOT per category).
// Renders as inline SVG; deterministic geometry.
export default function MiniRadar({ scores, size = 120, fill }: Props) {
  const n = scores.length
  if (n < 3) {
    // Fallback: tiny score row when there aren't enough metrics to form a polygon.
    return (
      <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end', height: size / 4 }}>
        {scores.map((s) => (
          <div
            key={s.id}
            title={`${s.label ?? s.id} · ${Math.round(s.score)}/100`}
            style={{
              width: 6,
              height: Math.max(2, (s.score / 100) * (size / 4)),
              background: recHex(s.score),
            }}
          />
        ))}
      </div>
    )
  }

  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 6

  // Build polygon points
  const points = scores
    .map((s, i) => {
      const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
      const dist = (Math.max(0, Math.min(100, s.score)) / 100) * r
      const x = cx + Math.cos(angle) * dist
      const y = cy + Math.sin(angle) * dist
      return `${x},${y}`
    })
    .join(' ')

  // Gridlines at 25/50/75/100%
  const gridLevels = [0.25, 0.5, 0.75, 1].map((t) => {
    const pts = Array.from({ length: n }, (_, i) => {
      const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
      const dist = t * r
      return `${cx + Math.cos(angle) * dist},${cy + Math.sin(angle) * dist}`
    }).join(' ')
    return pts
  })

  // Spokes
  const spokes = scores.map((_, i) => {
    const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
    return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r }
  })

  const avg = scores.reduce((a, b) => a + b.score, 0) / n
  const polyFill = fill ?? recHex(avg)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map((pts, i) => (
        <polygon
          key={i}
          points={pts}
          fill="none"
          stroke={SX.hairSoft}
          strokeWidth={1}
        />
      ))}
      {spokes.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={SX.hairSoft} strokeWidth={1} />
      ))}
      <polygon points={points} fill={polyFill} fillOpacity={0.18} stroke={polyFill} strokeWidth={1.5} />
      {scores.map((s, i) => {
        const angle = -Math.PI / 2 + (i / n) * Math.PI * 2
        const dist = (s.score / 100) * r
        const x = cx + Math.cos(angle) * dist
        const y = cy + Math.sin(angle) * dist
        return <circle key={s.id} cx={x} cy={y} r={2} fill={polyFill} />
      })}
    </svg>
  )
}
