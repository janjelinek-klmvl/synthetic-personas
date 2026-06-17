'use client'

import type { EstimateFormula } from '@/lib/types-as'

export default function CostPanel({ formula }: { formula: EstimateFormula | null }) {
  const lines = formula
    ? [
        { label: 'Base per run', value: formula.base },
        { label: 'Per quant metric', value: formula.per_quant_metric },
        { label: 'Per qual module', value: formula.per_qual_module },
        { label: 'Per respondent', value: formula.per_respondent },
        { label: 'Per 1,000 characters of idea', value: formula.per_idea_kchar },
      ]
    : []

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 14,
      }}
    >
      <div style={cardStyle}>
        <div style={cardEyebrow}>Unit</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, lineHeight: 1.1 }}>
          1 credit = $0.10
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
          Credits are billed in 1-credit increments. Cost depends on how heavy each run is.
        </div>
      </div>

      <div style={cardStyle}>
        <div style={cardEyebrow}>Typical test run</div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 8, lineHeight: 1.1 }}>
          30–80 credits
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5 }}>
          Cheaper with fewer metrics, modules, and respondents. The estimate updates live in
          Research settings before you click Run test.
        </div>
      </div>

      <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
        <div style={cardEyebrow}>How a run is priced</div>
        {lines.length === 0 ? (
          <div style={{ fontSize: 13, color: '#888', marginTop: 8 }}>Pricing unavailable.</div>
        ) : (
          <ul style={{ listStyle: 'none', margin: '10px 0 0', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lines.map((l) => (
              <li
                key={l.label}
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  background: '#fafafa',
                  borderRadius: 8,
                }}
              >
                <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{l.label}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {l.value} {l.value === 1 ? 'credit' : 'credits'}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 10, lineHeight: 1.5 }}>
          Total = base + (per-metric × N) + (per-module × N) + (per-respondent × N) + (per-1k-chars × idea size).
        </div>
      </div>
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
}

const cardEyebrow: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: 0.4,
}
