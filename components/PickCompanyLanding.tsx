'use client'

import { useEffect, useState } from 'react'

interface Company {
  id: string
  org_name: string
  active: boolean
}

export default function PickCompanyLanding() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/companies', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => setCompanies(d.companies ?? []))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false))
  }, [])

  const filtered = companies.filter((c) => c.org_name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '60px 20px 40px',
        background: 'var(--surface)',
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#2E63E0', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          BNT super-admin
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', margin: '8px 0 6px' }}>
          Pick a company to view
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
          You&apos;re a super-admin, so you don&apos;t belong to any one company. Pick which company&apos;s
          dashboard you want to act through. You can switch any time from the account menu.
        </p>

        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter companies…"
          style={{
            width: '100%',
            padding: '11px 14px',
            borderRadius: 10,
            border: '1.5px solid #e5e5e5',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ marginTop: 16, background: '#fff', borderRadius: 12, padding: 8, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          {loading && <RowMessage>Loading…</RowMessage>}
          {error && <RowMessage tone="err">{error}</RowMessage>}
          {!loading && !error && filtered.length === 0 && <RowMessage>No companies found.</RowMessage>}

          {filtered.map((c) => (
            <a
              key={c.id}
              href={`/impersonate?company_id=${encodeURIComponent(c.id)}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = '#fafafa')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{c.org_name}</div>
                {!c.active && (
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Inactive</div>
                )}
              </div>
              <span style={{ fontSize: 12, color: '#2E63E0', fontWeight: 600 }}>View →</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function RowMessage({ tone, children }: { tone?: 'err'; children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: '14px',
        fontSize: 13,
        color: tone === 'err' ? '#C4335A' : '#888',
        textAlign: 'center',
      }}
    >
      {children}
    </div>
  )
}
