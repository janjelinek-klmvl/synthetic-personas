'use client'

import { useEffect, useState } from 'react'
import { QuantitativeMetric } from '@/lib/types'

// 8 metrics in clockwise order starting from top
const METRICS = [
  { key: 'purchaseIntent',       label: 'Purchase\nIntent',        color: '#4A7CF8' },
  { key: 'desirability',         label: 'Desirability',            color: '#EC4899' },
  { key: 'uniqueness',           label: 'Uniqueness',              color: '#A855F7' },
  { key: 'valuePerception',      label: 'Value\nPerception',       color: '#F59E0B' },
  { key: 'emotionalResonance',   label: 'Emotional\nResonance',    color: '#F97316' },
  { key: 'trustAdoptionBarrier', label: 'Trust &\nAdoption',       color: '#EF4444' },
  { key: 'relevancy',            label: 'Relevancy',               color: '#10B981' },
  { key: 'brandFit',             label: 'Brand\nFit',              color: '#6366F1' },
]

const N  = METRICS.length
const CX = 240
const CY = 240
const R  = 140

// angle: start from top (-90°), clockwise
function axisAngle(i: number) {
  return (i * 2 * Math.PI) / N - Math.PI / 2
}

function axisPoint(i: number, pct: number) {
  const a = axisAngle(i)
  return { x: CX + R * pct * Math.cos(a), y: CY + R * pct * Math.sin(a) }
}

function labelPoint(i: number) {
  const a = axisAngle(i)
  // Extra padding on diagonal axes
  const isDiag = i % 2 === 1
  const dist = R + (isDiag ? 52 : 44)
  return { x: CX + dist * Math.cos(a), y: CY + dist * Math.sin(a) }
}

// Text anchor logic for 8 positions
function anchor(i: number): 'middle' | 'start' | 'end' {
  // top=0, top-right=1, right=2, bottom-right=3, bottom=4, bottom-left=5, left=6, top-left=7
  if (i === 0 || i === 4) return 'middle'
  if (i === 1 || i === 2 || i === 3) return 'start'
  return 'end'
}

interface Props {
  metrics: Record<string, QuantitativeMetric>
}

export default function RadarChart({ metrics }: Props) {
  const [animated, setAnimated] = useState(false)
  const [labelsVisible, setLabelsVisible] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setAnimated(true), 200)
    const t2 = setTimeout(() => setLabelsVisible(true), 1000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const scores = METRICS.map(m => metrics[m.key]?.score ?? 0)
  const rings  = [0.25, 0.5, 0.75, 1.0]

  // Octagon ring paths
  const ringPaths = rings.map(pct => {
    const pts = METRICS.map((_, i) => axisPoint(i, pct))
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'
  })

  // Data polygon
  const dataPoints = METRICS.map((_, i) => axisPoint(i, animated ? scores[i] / 100 : 0.01))
  const dataPath   = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z'

  // Score label positions (just outside the data dot)
  const scoreLabelPoints = METRICS.map((_, i) => {
    const pct = animated ? scores[i] / 100 : 0.01
    const a   = axisAngle(i)
    const offset = 20
    return { x: CX + (R * pct + offset) * Math.cos(a), y: CY + (R * pct + offset) * Math.sin(a) }
  })

  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        Signal Shape
      </div>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '24px 8px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        justifyContent: 'center',
      }}>
        <svg viewBox="0 0 480 480" width="100%" style={{ maxWidth: '480px', overflow: 'visible' }}>
          <defs>
            <radialGradient id="radarFill8" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#4A7CF8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#A855F7" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Grid rings */}
          {ringPaths.map((d, i) => (
            <path key={i} d={d}
              fill={i === 3 ? 'rgba(74,124,248,0.02)' : 'none'}
              stroke={i === 3 ? '#CBD5E1' : '#E8ECF2'}
              strokeWidth={i === 3 ? 1.5 : 1}
            />
          ))}

          {/* Ring % labels on top axis */}
          {[0.25, 0.5, 0.75].map(pct => {
            const p = axisPoint(0, pct)
            return (
              <text key={pct}
                x={(p.x + 5).toFixed(1)} y={(p.y + 3).toFixed(1)}
                fontSize={8} fill="#94A3B8" fontFamily="inherit" textAnchor="start">
                {Math.round(pct * 100)}%
              </text>
            )
          })}

          {/* Colored dashed axis lines */}
          {METRICS.map((m, i) => {
            const end = axisPoint(i, 1)
            return (
              <line key={i}
                x1={CX} y1={CY}
                x2={end.x.toFixed(1)} y2={end.y.toFixed(1)}
                stroke={m.color} strokeWidth={1.5} strokeOpacity={0.25}
                strokeDasharray="4 3"
              />
            )
          })}

          {/* Data polygon — gradient fill */}
          <path d={dataPath}
            fill="url(#radarFill8)"
            style={{ transition: 'all 900ms cubic-bezier(0.4,0,0.2,1)' }}
          />

          {/* Data polygon — stroke */}
          <path d={dataPath}
            fill="none"
            stroke="#4A7CF8"
            strokeWidth={2.5}
            strokeLinejoin="round"
            style={{ transition: 'all 900ms cubic-bezier(0.4,0,0.2,1)' }}
          />

          {/* Colored dots with glow rings */}
          {dataPoints.map((p, i) => (
            <g key={i} style={{ transition: 'all 900ms cubic-bezier(0.4,0,0.2,1)' }}>
              <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={9}
                fill={METRICS[i].color} fillOpacity={0.15} />
              <circle cx={p.x.toFixed(1)} cy={p.y.toFixed(1)} r={5}
                fill={METRICS[i].color} stroke="#fff" strokeWidth={2} />
            </g>
          ))}

          {/* Score labels at each data point */}
          {labelsVisible && scoreLabelPoints.map((p, i) => (
            <text key={i}
              x={p.x.toFixed(1)} y={(p.y + 4).toFixed(1)}
              textAnchor={anchor(i)}
              fontSize={11} fontWeight={700}
              fill={METRICS[i].color}
              fontFamily="inherit"
              style={{ opacity: 1, transition: 'opacity 400ms ease' }}>
              {scores[i]}%
            </text>
          ))}

          {/* Axis labels */}
          {METRICS.map((m, i) => {
            const p    = labelPoint(i)
            const lines = m.label.split('\n')
            const anc  = anchor(i)
            const dyStart = lines.length > 1 ? -6 : 4

            return (
              <text key={i}
                x={p.x.toFixed(1)} y={p.y.toFixed(1)}
                textAnchor={anc} fontSize={10} fontWeight={700}
                fill={m.color} fontFamily="inherit">
                {lines.map((line, li) => (
                  <tspan key={li} x={p.x.toFixed(1)} dy={li === 0 ? dyStart : 13}>
                    {line}
                  </tspan>
                ))}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
