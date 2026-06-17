'use client'

import { useEffect, useState } from 'react'
import CreditsHero from '@/components/credits/CreditsHero'
import UsageChart from '@/components/credits/UsageChart'
import ActivityList from '@/components/credits/ActivityList'
import PricingTable from '@/components/credits/PricingTable'
import AdditionalServices from '@/components/credits/AdditionalServices'
import { useAudiences } from '@/lib/personas'
import AppHeader from '@/components/AppHeader'
import Cap from '@/components/design/Cap'
import { SX, FONT, PAGE_W } from '@/lib/design/tokens'

export interface MeCreditsResponse {
  balance: number
  plan: { id: string; name: string; monthly_allowance: number }
  period: {
    started_at: string | null
    renews_at: string | null
    used_this_period: number
    allowance_remaining: number
    carryover: number
  }
  usage_30d: Array<{ date: string; credits_spent: number }>
  recent_ledger: Array<{
    id: string
    amount: number
    reason: string
    run_id: string | null
    created_at: string
    note: string | null
  }>
  forecast_days_remaining: number | null
  can_purchase: boolean
}

export default function CreditsClient() {
  const { pricing } = useAudiences()
  const [data, setData] = useState<MeCreditsResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me/credits', { cache: 'no-store' })
      .then(async (r) => {
        const body = await r.json()
        if (!r.ok) throw new Error(body?.error ?? `HTTP ${r.status}`)
        return body as MeCreditsResponse
      })
      .then((d) => {
        if (!cancelled) setData(d)
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: SX.paper }}>
      <AppHeader />

      <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '56px 48px 96px' }}>
        <div
          style={{
            borderTop: `2px solid ${SX.accent}`,
            paddingTop: 14,
            marginBottom: 32,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            gap: 24,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Cap color={SX.accent} size={11}>
              Credits &amp; usage
            </Cap>
            <h1
              style={{
                margin: '12px 0 12px',
                fontFamily: FONT.grotesque,
                fontSize: 38,
                fontWeight: 800,
                letterSpacing: '-0.03em',
                color: SX.ink,
                lineHeight: 1,
              }}
            >
              What you&apos;ve spent.
            </h1>
          </div>
          {data && (
            <Cap color={SX.soft} size={10}>
              {data.plan.name} plan
              {data.period.renews_at && ` · renews ${new Date(data.period.renews_at).toLocaleDateString()}`}
            </Cap>
          )}
        </div>

        {error && (
          <div
            style={{
              padding: 14,
              border: `1px solid ${SX.accent}`,
              background: SX.accentGhost,
              color: SX.accent,
              fontFamily: FONT.grotesque,
              fontSize: 13,
              marginBottom: 20,
            }}
          >
            {error}
          </div>
        )}

        {!data && !error && (
          <div
            style={{
              padding: 40,
              textAlign: 'center',
              color: SX.soft,
              fontFamily: FONT.grotesque,
              fontSize: 14,
            }}
          >
            Loading…
          </div>
        )}

        {data && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '300px 1fr',
              gap: 32,
              alignItems: 'start',
            }}
          >
            <CreditsHero data={data} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
              <UsageChart days={data.usage_30d} forecastDays={data.forecast_days_remaining} />
              <ActivityList entries={data.recent_ledger} />
              <PricingTable formula={pricing?.formula ?? null} />
              <AdditionalServices />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
