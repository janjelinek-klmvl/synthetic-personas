'use client'

import AppHeader from '@/components/AppHeader'
import {
  CREDITS_BALANCE,
  CREDITS_MONTHLY_ALLOWANCE,
  CREDITS_USED_THIS_MONTH,
  CREDITS_RENEWAL_DATE,
  COST_RUN_TEST,
  COST_ADD_PERSONA,
  TOPUP_PACKAGES,
} from '@/lib/credits'

const CREDITS_FROM_ALLOWANCE = CREDITS_MONTHLY_ALLOWANCE - CREDITS_USED_THIS_MONTH
const CREDITS_CARRIED_OVER = CREDITS_BALANCE - CREDITS_FROM_ALLOWANCE
const PROGRESS_PCT = Math.min((CREDITS_USED_THIS_MONTH / CREDITS_MONTHLY_ALLOWANCE) * 100, 100)

const PRICE_ITEMS = [
  {
    label: 'Monthly subscription',
    tag: 'Plan',
    credits: `${CREDITS_MONTHLY_ALLOWANCE.toLocaleString()} cr / month`,
    usd: '$200 / month',
    note: 'Billed monthly · cancel anytime',
    icon: '📅',
  },
  {
    label: 'Test run',
    tag: 'Per action',
    credits: `${COST_RUN_TEST.toLocaleString()} credits`,
    usd: `~$${(COST_RUN_TEST * 0.1).toFixed(0)}`,
    note: 'Per persona tested in a single report',
    icon: '⚡',
  },
  {
    label: 'Custom persona',
    tag: 'One-time',
    credits: `${COST_ADD_PERSONA.toLocaleString()} credits`,
    usd: `~$${(COST_ADD_PERSONA * 0.1).toLocaleString()}`,
    note: 'Permanently added to your workspace',
    icon: '👤',
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <AppHeader />

      <div className="container-lg" style={{ paddingTop: '48px', paddingBottom: '80px' }}>

        {/* Page heading */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '28px', fontWeight: 800, letterSpacing: '-0.025em',
            color: 'var(--text-primary)', margin: '0 0 6px',
          }}>
            Credits
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
            Track your usage and understand what each action costs.
          </p>
        </div>

        {/* ── Balance card ──────────────────────────────────────── */}
        <div className="card" style={{ marginBottom: '40px', padding: '28px 32px' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start',
            justifyContent: 'space-between', gap: '24px',
            flexWrap: 'wrap',
          }}>

            {/* Left: balance */}
            <div style={{ flex: 1, minWidth: '200px' }}>
              <div style={{
                fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', color: 'var(--text-tertiary)',
                marginBottom: '10px',
              }}>
                Current balance
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '14px', lineHeight: 1 }}>🪙</span>
                <span style={{
                  fontSize: '44px', fontWeight: 800, letterSpacing: '-0.04em',
                  color: 'var(--text-primary)', lineHeight: 1,
                }}>
                  {CREDITS_BALANCE.toLocaleString()}
                </span>
                <span style={{ fontSize: '15px', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  credits
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{
                  height: '6px', borderRadius: '999px',
                  background: 'var(--border)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${PROGRESS_PCT}%`,
                    borderRadius: '999px',
                    background: PROGRESS_PCT > 80 ? 'var(--orange)' : 'var(--primary)',
                    transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  }} />
                </div>
              </div>

              {/* Usage breakdown */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {CREDITS_USED_THIS_MONTH.toLocaleString()}
                  </span>{' '}used this month
                </span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                    {CREDITS_FROM_ALLOWANCE.toLocaleString()}
                  </span>{' '}remaining from allowance
                </span>
                {CREDITS_CARRIED_OVER > 0 && (
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>
                      {CREDITS_CARRIED_OVER.toLocaleString()}
                    </span>{' '}carried over
                  </span>
                )}
              </div>
            </div>

            {/* Right: renewal + CTA */}
            <div style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end', gap: '12px',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                Renews {CREDITS_RENEWAL_DATE}
              </span>
              <button
                className="btn btn-primary"
                style={{ whiteSpace: 'nowrap' }}
              >
                Buy more credits
              </button>
            </div>
          </div>
        </div>

        {/* ── Price list ────────────────────────────────────────── */}
        <div style={{ marginBottom: '12px' }}>
          <h2 style={{
            fontSize: '16px', fontWeight: 700, letterSpacing: '-0.015em',
            color: 'var(--text-primary)', margin: '0 0 4px',
          }}>
            What things cost
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            1 credit = $0.10 USD
          </p>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px',
            marginBottom: '40px',
          }}>
            {PRICE_ITEMS.map(item => (
              <div key={item.label} className="card" style={{ padding: '24px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', marginBottom: '16px',
                }}>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em',
                    textTransform: 'uppercase', color: 'var(--text-tertiary)',
                  }}>
                    {item.tag}
                  </span>
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                </div>

                <div style={{
                  fontSize: '17px', fontWeight: 700, letterSpacing: '-0.02em',
                  color: 'var(--text-primary)', marginBottom: '6px',
                }}>
                  {item.label}
                </div>

                <div style={{
                  fontSize: '28px', fontWeight: 800, letterSpacing: '-0.04em',
                  color: 'var(--text-primary)', lineHeight: 1, marginBottom: '4px',
                }}>
                  {item.usd}
                </div>
                <div style={{
                  fontSize: '13px', color: 'var(--text-secondary)',
                  marginBottom: '16px',
                }}>
                  {item.credits}
                </div>

                <div style={{
                  paddingTop: '16px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '12px', color: 'var(--text-tertiary)',
                }}>
                  {item.note}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Top-up packages ───────────────────────────────────── */}
        <div>
          <h2 style={{
            fontSize: '16px', fontWeight: 700, letterSpacing: '-0.015em',
            color: 'var(--text-primary)', margin: '0 0 4px',
          }}>
            Top up
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
            Extra credits never expire.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {TOPUP_PACKAGES.map(pkg => (
              <button
                key={pkg.credits}
                className="btn btn-secondary"
                style={{
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'flex-start', gap: '2px',
                  padding: '14px 20px', borderRadius: '14px',
                  height: 'auto', minWidth: '140px',
                }}
              >
                <span style={{
                  fontSize: '18px', fontWeight: 800,
                  letterSpacing: '-0.03em', color: 'var(--text-primary)',
                  lineHeight: 1,
                }}>
                  🪙 {pkg.credits.toLocaleString()}
                </span>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  ${pkg.price}
                  {pkg.saving && (
                    <span style={{
                      marginLeft: '6px',
                      fontSize: '11px', fontWeight: 700,
                      color: 'var(--primary)',
                    }}>
                      save {pkg.saving}%
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
