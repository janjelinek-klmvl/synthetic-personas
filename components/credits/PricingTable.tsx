'use client'

import type { EstimateFormula } from '@/lib/types-as'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Props {
  formula: EstimateFormula | null
}

// "How a run is priced" — bordered table with line items + footer caption.
export default function PricingTable({ formula }: Props) {
  if (!formula) {
    return (
      <section
        style={{
          border: `1px solid ${SX.hair}`,
          background: SX.paper,
          padding: 24,
          textAlign: 'center',
          fontFamily: FONT.grotesque,
          fontSize: 13,
          color: SX.faint,
        }}
      >
        Loading pricing…
      </section>
    )
  }

  const rows = [
    { label: 'Base per run', value: formula.base },
    { label: 'Per quant metric', value: formula.per_quant_metric },
    { label: 'Per qual module', value: formula.per_qual_module },
    { label: 'Per respondent', value: formula.per_respondent },
    { label: 'Per 1,000 chars of idea', value: formula.per_idea_kchar },
  ]

  return (
    <section style={{ border: `1px solid ${SX.hair}`, background: SX.paper, padding: 22 }}>
      <Cap color={SX.soft} size={10}>
        How a run is priced
      </Cap>
      <div style={{ marginTop: 14, border: `1px solid ${SX.hair}` }}>
        {rows.map((r, i) => (
          <div
            key={r.label}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: i === rows.length - 1 ? 'none' : `1px solid ${SX.hairSoft}`,
            }}
          >
            <span style={{ fontFamily: FONT.grotesque, fontSize: 13, color: SX.ink }}>{r.label}</span>
            <span
              style={{
                fontFamily: FONT.grotesque,
                fontSize: 14,
                fontWeight: 800,
                color: SX.ink,
                letterSpacing: '-0.01em',
                ...TNUM,
              }}
            >
              {r.value.toLocaleString()} {r.value === 1 ? 'credit' : 'credits'}
            </span>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 12,
          fontFamily: FONT.grotesque,
          fontSize: 11.5,
          color: SX.soft,
          lineHeight: 1.5,
        }}
      >
        Total = base + (per-metric × N) + (per-module × N) + (per-respondent × N) + (per-1k-chars × idea size). 1 credit ≈ $0.10.
      </div>
    </section>
  )
}
