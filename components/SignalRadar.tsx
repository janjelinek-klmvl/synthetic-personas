'use client'

import type { AudienceQuantResult, QuantMetricMeta } from '@/lib/types-as'

interface Props {
  results: Record<string, AudienceQuantResult>
  meta: QuantMetricMeta[]
  accent?: string
}

export default function SignalRadar({ results, meta, accent = '#3D52C4' }: Props) {
  const axes = Object.keys(results)
    .map((id) => {
      const m = meta.find((x) => x.id === id)
      const scale = m?.scoring_scale
      const score = typeof results[id].score === 'number' ? results[id].score : null
      if (score == null || !scale || scale.max <= scale.min) return null
      const normalized = (score - scale.min) / (scale.max - scale.min)
      return {
        id,
        label: m?.name ?? id,
        normalized: Math.max(0, Math.min(1, normalized)),
        rawScore: score,
        scale,
      }
    })
    .filter((x): x is NonNullable<typeof x> => x != null)

  if (axes.length < 3) return null

  const size = 320
  const cx = size / 2
  const cy = size / 2
  const labelPad = 56
  const r = (size - labelPad * 2) / 2
  const rings = [0.25, 0.5, 0.75, 1]

  const angleFor = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2
  const point = (i: number, t: number): [number, number] => {
    const a = angleFor(i)
    return [cx + Math.cos(a) * r * t, cy + Math.sin(a) * r * t]
  }

  const polygonPoints = axes
    .map((axis, i) => {
      const [x, y] = point(i, axis.normalized)
      return `${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Signal shape">
        {rings.map((t) => (
          <polygon
            key={t}
            points={axes.map((_, i) => point(i, t).map((n) => n.toFixed(1)).join(',')).join(' ')}
            fill="none"
            stroke="#e6e6e6"
            strokeWidth={1}
          />
        ))}

        {axes.map((_, i) => {
          const [x, y] = point(i, 1)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#ececec" strokeWidth={1} />
        })}

        <polygon points={polygonPoints} fill={accent} fillOpacity={0.18} stroke={accent} strokeWidth={2} />

        {axes.map((axis, i) => {
          const [px, py] = point(i, axis.normalized)
          return <circle key={`pt-${axis.id}`} cx={px} cy={py} r={3.5} fill={accent} />
        })}

        {axes.map((axis, i) => {
          const a = angleFor(i)
          const lx = cx + Math.cos(a) * (r + 22)
          const ly = cy + Math.sin(a) * (r + 22)
          const anchor =
            Math.abs(Math.cos(a)) < 0.2 ? 'middle' : Math.cos(a) > 0 ? 'start' : 'end'
          const dy = Math.sin(a) > 0.4 ? 12 : Math.sin(a) < -0.4 ? -4 : 4
          return (
            <text
              key={`lbl-${axis.id}`}
              x={lx}
              y={ly + dy}
              fontSize={11}
              fontWeight={600}
              fill="#555"
              textAnchor={anchor}
            >
              <title>{axis.label}</title>
              {truncate(axis.label, 14)}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

function truncate(s: string, n: number): string {
  return s.length <= n ? s : s.slice(0, n - 1) + '…'
}
