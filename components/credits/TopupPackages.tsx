'use client'

import { useEffect, useState } from 'react'

interface Pkg {
  usd: number
  credits: number
  bonusPct: number
  label: string
}

// 1 credit = $0.10, so 100 USD = 1,000 credits at base.
const PACKAGES: Pkg[] = [
  { usd: 500,  credits: 5_000,  bonusPct: 0,  label: '' },
  { usd: 1000, credits: 11_000, bonusPct: 10, label: 'save 10%' },
  { usd: 5000, credits: 60_000, bonusPct: 20, label: 'save 20%' },
]

interface Props {
  canPurchase: boolean
  balance: number
}

export default function TopupPackages({ canPurchase, balance }: Props) {
  const [contactPkg, setContactPkg] = useState<Pkg | null>(null)

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
        {PACKAGES.map((p) => (
          <button
            key={p.usd}
            type="button"
            onClick={() => canPurchase && setContactPkg(p)}
            disabled={!canPurchase}
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 20,
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              border: '1.5px solid transparent',
              cursor: canPurchase ? 'pointer' : 'not-allowed',
              opacity: canPurchase ? 1 : 0.6,
              textAlign: 'left',
              transition: 'border-color 0.15s, transform 0.1s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { if (canPurchase) (e.currentTarget as HTMLElement).style.borderColor = 'var(--primary)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 14 }}>🪙</span>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em' }}>
                {p.credits.toLocaleString()}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 6 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>${p.usd.toLocaleString()}</span>
              {p.label && (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)' }}>{p.label}</span>
              )}
            </div>
            {!canPurchase && (
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 10 }}>
                Ask your admin to top up.
              </div>
            )}
          </button>
        ))}
      </div>

      {contactPkg && (
        <ContactModal pkg={contactPkg} currentBalance={balance} onClose={() => setContactPkg(null)} />
      )}
    </>
  )
}

function ContactModal({
  pkg,
  currentBalance,
  onClose,
}: {
  pkg: Pkg
  currentBalance: number
  onClose: () => void
}) {
  const [copied, setCopied] = useState(false)
  const [companyId, setCompanyId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setCompanyId(d?.company?.id ?? null))
      .catch(() => {})
  }, [])

  const subject = `Top-up request: ${pkg.credits.toLocaleString()} credits ($${pkg.usd})`
  const body = [
    `Hi BNT team,`,
    ``,
    `Please top up our credits:`,
    `· Package: ${pkg.credits.toLocaleString()} credits for $${pkg.usd}${pkg.label ? ` (${pkg.label})` : ''}`,
    `· Current balance: ${currentBalance.toLocaleString()} credits`,
    companyId ? `· Company id: ${companyId}` : '',
    ``,
    `Thanks!`,
  ].filter(Boolean).join('\n')

  const mailto = `mailto:billing@bnt.agency?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`

  async function copyDetails() {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.32)', zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: 28,
          width: '100%', maxWidth: 480,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          Top-up request
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, margin: '6px 0 12px' }}>
          {pkg.credits.toLocaleString()} credits — ${pkg.usd}
        </h3>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.55, margin: 0 }}>
          Self-serve billing is coming soon. For now, email BNT and we&apos;ll top up your account
          within one business day.
        </p>
        <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' }}>
          <a
            href={mailto}
            style={{
              padding: '10px 18px', borderRadius: 10, background: '#1a1a1a', color: '#fff',
              textDecoration: 'none', fontSize: 13, fontWeight: 600, flex: 1, textAlign: 'center',
            }}
          >
            Compose email
          </a>
          <button
            type="button"
            onClick={copyDetails}
            style={{
              padding: '10px 16px', borderRadius: 10, border: '1.5px solid #e5e5e5',
              background: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {copied ? '✓ Copied' : 'Copy details'}
          </button>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 16px', borderRadius: 10, border: 'none',
              background: 'transparent', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
