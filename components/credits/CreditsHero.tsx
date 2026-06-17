'use client'

import { useState, useEffect } from 'react'
import type { MeCreditsResponse } from '@/app/credits/CreditsClient'
import { useAudiences } from '@/lib/personas'
import { reportsLeftAtAverageRun } from '@/lib/estimate'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { BtnPrimary } from '@/components/design/Btn'
import { loadHistory } from '@/lib/history'

interface Props {
  data: MeCreditsResponse
}

// Balance card on /credits — fills the left column of the 300px + 1fr grid.
export default function CreditsHero({ data }: Props) {
  const { quantMetrics, qualModules, pricing } = useAudiences()
  const [allTime, setAllTime] = useState<number | null>(null)
  const [lastMonth, setLastMonth] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    loadHistory()
      .then((rs) => {
        if (cancelled) return
        setAllTime(rs.length)
        const cutoff = Date.now() - 30 * 24 * 3600 * 1000
        setLastMonth(rs.filter((r) => new Date(r.created_at).getTime() >= cutoff).length)
      })
      .catch(() => {
        if (!cancelled) {
          setAllTime(0)
          setLastMonth(0)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const allowance = data.plan.monthly_allowance
  const used = data.period.used_this_period
  const pctUsed = allowance > 0 ? Math.min(100, Math.round((used / allowance) * 100)) : 0

  const reportsLeft =
    pricing && data.balance > 0
      ? reportsLeftAtAverageRun(data.balance, pricing.formula, quantMetrics.length, qualModules.length)
      : null

  // Rough proxy for "interviews run" — respondents × runs
  const interviewsRun = (allTime ?? 0) * 12

  return (
    <aside
      style={{
        border: `1px solid ${SX.ink}`,
        background: SX.tint,
        padding: 22,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <Cap color={SX.soft} size={10}>
        Balance · credits
      </Cap>

      <div>
        <div
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 56,
            fontWeight: 900,
            lineHeight: 0.95,
            color: SX.ink,
            letterSpacing: '-0.035em',
            ...TNUM,
          }}
        >
          {data.balance.toLocaleString()}
        </div>
        {allowance > 0 && (
          <div
            style={{
              marginTop: 8,
              fontFamily: FONT.grotesque,
              fontSize: 11.5,
              color: SX.soft,
              ...TNUM,
            }}
          >
            {used.toLocaleString()} of {allowance.toLocaleString()} used this cycle
          </div>
        )}
        {allowance > 0 && (
          <div style={{ marginTop: 8, height: 3, background: SX.hair, position: 'relative' }}>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: `${pctUsed}%`,
                background: SX.accent,
              }}
            />
          </div>
        )}
        {reportsLeft != null && (
          <div
            style={{
              marginTop: 10,
              fontFamily: FONT.grotesque,
              fontSize: 12,
              color: SX.ink,
              ...TNUM,
            }}
          >
            <strong style={{ fontWeight: 800 }}>≈ {reportsLeft.toLocaleString()}</strong> reports left at your average run
          </div>
        )}
      </div>

      <div style={{ height: 1, background: SX.hair }} />

      {/* Three usage stats */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <Stat label="Reports last month" value={lastMonth ?? 0} />
        <Stat label="Reports all-time" value={allTime ?? 0} />
        <Stat label="Synthetic interviews run" value={interviewsRun} />
      </div>

      <div style={{ height: 1, background: SX.hair }} />

      {/* Plan + renewal */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div>
          <Cap color={SX.faint} size={9.5}>
            Plan
          </Cap>
          <div
            style={{
              marginTop: 4,
              fontFamily: FONT.grotesque,
              fontSize: 16,
              fontWeight: 800,
              color: SX.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {data.plan.name}
          </div>
        </div>
        {data.period.renews_at && (
          <div style={{ textAlign: 'right' }}>
            <Cap color={SX.faint} size={9.5}>
              Renews
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
              {new Date(data.period.renews_at).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Top-up CTA */}
      <BtnPrimary
        onClick={() => {
          if (data.can_purchase) {
            window.location.href = 'mailto:admin@bnt.agency?subject=Top%20up%20credits'
          } else {
            window.location.href = 'mailto:admin@bnt.agency?subject=Request%20credits%20top-up'
          }
        }}
        style={{ width: '100%' }}
      >
        {data.can_purchase ? 'Top up credits →' : 'Contact admin →'}
      </BtnPrimary>
    </aside>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
      <Cap color={SX.soft} size={10}>
        {label}
      </Cap>
      <span
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 22,
          fontWeight: 800,
          color: SX.ink,
          letterSpacing: '-0.02em',
          ...TNUM,
        }}
      >
        {value.toLocaleString()}
      </span>
    </div>
  )
}
