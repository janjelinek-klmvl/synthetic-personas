'use client'

import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Props {
  days: Array<{ date: string; credits_spent: number }>
  forecastDays: number | null
}

// Bar chart — last 30 days. Ink bars, last (current) bar accent.
export default function UsageChart({ days, forecastDays }: Props) {
  const max = Math.max(1, ...days.map((d) => d.credits_spent))
  const totalUsed = days.reduce((s, d) => s + d.credits_spent, 0)
  const W = 720
  const H = 160
  const barW = W / Math.max(1, days.length)

  return (
    <section style={{ border: `1px solid ${SX.hair}`, background: SX.paper, padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <Cap color={SX.soft} size={10}>
            Usage · last 30 days
          </Cap>
          <div
            style={{
              marginTop: 6,
              fontFamily: FONT.grotesque,
              fontSize: 20,
              fontWeight: 800,
              color: SX.ink,
              letterSpacing: '-0.02em',
              ...TNUM,
            }}
          >
            {totalUsed.toLocaleString()} credits
          </div>
        </div>
        {forecastDays != null && (
          <div style={{ textAlign: 'right' }}>
            <Cap color={SX.faint} size={9.5}>
              At this pace
            </Cap>
            <div
              style={{
                marginTop: 4,
                fontFamily: FONT.grotesque,
                fontSize: 12,
                fontWeight: 700,
                color: SX.ink,
                ...TNUM,
              }}
            >
              ~{forecastDays} {forecastDays === 1 ? 'day' : 'days'} remaining
            </div>
          </div>
        )}
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="30-day usage" style={{ marginTop: 16 }}>
        {days.map((d, i) => {
          const h = (d.credits_spent / max) * (H - 20)
          const isLast = i === days.length - 1
          return (
            <g key={d.date}>
              <rect
                x={i * barW + 1}
                y={H - 14 - h}
                width={Math.max(2, barW - 2)}
                height={h}
                fill={isLast ? SX.accent : SX.ink}
              >
                <title>
                  {d.date} · {d.credits_spent} credits
                </title>
              </rect>
            </g>
          )
        })}
        <line x1={0} y1={H - 14} x2={W} y2={H - 14} stroke={SX.hair} strokeWidth={1} />
      </svg>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontFamily: FONT.grotesque,
          fontSize: 10,
          color: SX.faint,
          letterSpacing: '0.02em',
          ...TNUM,
        }}
      >
        <span>{days[0]?.date}</span>
        <span>{days[days.length - 1]?.date}</span>
      </div>
    </section>
  )
}
