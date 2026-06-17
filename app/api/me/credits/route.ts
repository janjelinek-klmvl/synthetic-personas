import { NextResponse } from 'next/server'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'
import { supabaseAdmin } from '@/lib/supabase-server'

// Plan tiers mirror AS's lib/credits.ts:PLANS. Kept inline so SP can render
// nice names without a cross-app fetch; if these drift, we re-sync.
const PLAN_NAMES: Record<string, string> = {
  trial: 'Trial',
  starter: 'Starter',
  pro: 'Pro',
  enterprise: 'Enterprise',
  custom: 'Custom',
}

interface LedgerRow {
  id: string
  amount: number
  reason: string
  run_id: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface ClientRow {
  plan_id: string
  monthly_allowance: number
  current_period_started_at: string | null
  credit_balance: number
}

/**
 * Returns the full credits view for the current user's company. Both members
 * and admins may read; only admins should see Buy buttons (gated via
 * `can_purchase`).
 */
export async function GET() {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }

  const { data: client } = await supabaseAdmin
    .from('api_clients')
    .select('plan_id, monthly_allowance, current_period_started_at, credit_balance')
    .eq('id', ctx.companyId)
    .single<ClientRow>()

  if (!client) {
    return NextResponse.json({ error: 'COMPANY_NOT_FOUND' }, { status: 404 })
  }

  const balance = client.credit_balance ?? 0
  const planId = client.plan_id ?? 'trial'
  const monthlyAllowance = client.monthly_allowance ?? 0
  const periodStart = client.current_period_started_at ? new Date(client.current_period_started_at) : null
  const periodEnd = periodStart ? new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000) : null

  // Fetch ledger entries for this company. Cap at the largest window we need
  // (30 days of usage + 20 most-recent rows). Pull a generous slab and slice
  // in code — keeps a single round-trip.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sinceCutoff = periodStart && periodStart < thirtyDaysAgo ? periodStart : thirtyDaysAgo

  const { data: ledgerData } = await supabaseAdmin
    .from('credit_ledger')
    .select('id, amount, reason, run_id, metadata, created_at')
    .eq('company_id', ctx.companyId)
    .gte('created_at', sinceCutoff.toISOString())
    .order('created_at', { ascending: false })
    .limit(500)

  const ledger = (ledgerData ?? []) as LedgerRow[]

  // Used-this-period: sum of |charge| - sum of refund within current period.
  let usedThisPeriod = 0
  if (periodStart) {
    for (const row of ledger) {
      const ts = new Date(row.created_at)
      if (ts < periodStart) continue
      if (row.reason === 'charge') usedThisPeriod += Math.abs(row.amount)
      else if (row.reason === 'refund') usedThisPeriod -= row.amount
    }
    usedThisPeriod = Math.max(0, usedThisPeriod)
  }

  const allowanceRemaining = Math.max(0, monthlyAllowance - usedThisPeriod)
  const carryover = Math.max(0, balance - allowanceRemaining)

  // 30-day usage chart: aggregate negative ledger amounts (charges minus refunds) by day.
  const dayBuckets: Record<string, number> = {}
  for (let i = 0; i < 30; i++) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    dayBuckets[d.toISOString().slice(0, 10)] = 0
  }
  for (const row of ledger) {
    const ts = new Date(row.created_at)
    if (ts < thirtyDaysAgo) continue
    const day = ts.toISOString().slice(0, 10)
    if (!(day in dayBuckets)) continue
    if (row.reason === 'charge') dayBuckets[day] += Math.abs(row.amount)
    else if (row.reason === 'refund') dayBuckets[day] -= row.amount
  }
  const usage30d = Object.entries(dayBuckets)
    .map(([date, credits_spent]) => ({ date, credits_spent: Math.max(0, credits_spent) }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Forecast: average burn over the last 7 days. If 0, no forecast.
  const last7 = usage30d.slice(-7)
  const burn7 = last7.reduce((s, x) => s + x.credits_spent, 0)
  const avgDaily = burn7 / 7
  const forecastDaysRemaining = avgDaily > 0 ? Math.floor(balance / avgDaily) : null

  // Recent activity: last 20 entries, with sensitive metadata stripped.
  const recentLedger = ledger.slice(0, 20).map((r) => ({
    id: r.id,
    amount: r.amount,
    reason: r.reason,
    run_id: r.run_id,
    created_at: r.created_at,
    note: typeof r.metadata?.note === 'string' ? r.metadata.note as string : null,
  }))

  return NextResponse.json({
    balance,
    plan: { id: planId, name: PLAN_NAMES[planId] ?? planId, monthly_allowance: monthlyAllowance },
    period: {
      started_at: periodStart?.toISOString() ?? null,
      renews_at: periodEnd?.toISOString() ?? null,
      used_this_period: usedThisPeriod,
      allowance_remaining: allowanceRemaining,
      carryover,
    },
    usage_30d: usage30d,
    recent_ledger: recentLedger,
    forecast_days_remaining: forecastDaysRemaining,
    can_purchase: ctx.role === 'admin',
  })
}
