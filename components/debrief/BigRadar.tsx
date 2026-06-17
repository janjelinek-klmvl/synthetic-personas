'use client'

import { SX, FONT, TNUM } from '@/lib/design/tokens'
import { bandFor, bandColor } from '@/lib/reception-colors'

interface RadarItem {
  id: string
  name: string
  value: number // 0–100
}

interface Props {
  data: RadarItem[]
  size?: number
  color?: string
  labels?: boolean
  // When true, color each spoke's marker/value/axis by its reception band.
  bandColors?: boolean
}

// Big spider chart with labels (ported from UXRadar in ux-shared.jsx).
// Used in the Verdict chapter (bandColors on) and the audiences grid (labels off).
export default function BigRadar({ data, size = 400, color, labels = true, bandColors = false }: Props) {
  const accent = color ?? SX.accent
  // Per-spoke band color when bandColors is on; otherwise the single accent.
  const spokeColor = (value: number) => (bandColors ? bandColor(bandFor(value)) : accent)
  if (data.length < 3) return null
  const pad = labels ? 84 : 10
  const RR = size / 2 - pad
  const cx = size / 2
  const cy = size / 2
  const n = data.length
  const ang = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2
  const pt = (i: number, r: number): [number, number] => [
    cx + Math.cos(ang(i)) * r,
    cy + Math.sin(ang(i)) * r,
  ]

  const rings = labels ? [0.25, 0.5, 0.75, 1] : [0.5, 1]
  const ringPoly = (f: number) =>
    data.map((_, i) => pt(i, RR * f).map((v) => v.toFixed(1)).join(',')).join(' ')
  const dataPoly = data
    .map((d, i) => pt(i, RR * (Math.max(0, Math.min(100, d.value)) / 100)).map((v) => v.toFixed(1)).join(','))
    .join(' ')

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {rings.map((f, i) => (
        <polygon key={i} points={ringPoly(f)} fill="none" stroke={SX.hair} strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const [x, y] = pt(i, RR)
        const stroke = bandColors ? spokeColor(d.value) : SX.hair
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x}
            y2={y}
            stroke={stroke}
            strokeWidth="1"
            strokeOpacity={bandColors ? 0.35 : 1}
          />
        )
      })}
      {labels && (
        <polygon
          points={ringPoly(0.5)}
          fill="none"
          stroke={SX.faint}
          strokeWidth="1"
          strokeDasharray="2 3"
        />
      )}
      <polygon
        points={dataPoly}
        fill={bandColors ? SX.ink : accent}
        fillOpacity={bandColors ? 0.06 : 0.12}
        stroke={bandColors ? SX.ink : accent}
        strokeWidth={labels ? 2 : 1.5}
        strokeLinejoin="round"
      />
      {labels &&
        data.map((d, i) => {
          const [x, y] = pt(i, RR * (Math.max(0, Math.min(100, d.value)) / 100))
          return <rect key={i} x={x - 3.5} y={y - 3.5} width="7" height="7" fill={spokeColor(d.value)} />
        })}
      {labels &&
        data.map((d, i) => {
          const [lx, ly] = pt(i, RR + 24)
          const dx = lx - cx
          const anchor = Math.abs(dx) < 6 ? 'middle' : dx < 0 ? 'end' : 'start'
          return (
            <g key={i}>
              <text
                x={lx}
                y={ly - 4}
                textAnchor={anchor}
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fill: SX.ink,
                }}
              >
                {d.name}
              </text>
              <text
                x={lx}
                y={ly + 9}
                textAnchor={anchor}
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 11,
                  fontWeight: 800,
                  fill: spokeColor(d.value),
                  ...(TNUM as React.CSSProperties),
                }}
              >
                {Math.round(d.value)}
              </text>
            </g>
          )
        })}
    </svg>
  )
}
