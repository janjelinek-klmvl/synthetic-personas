'use client'

import { useState } from 'react'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Entry {
  id: string
  amount: number
  reason: string
  run_id: string | null
  created_at: string
  note: string | null
}

const REASON_LABEL: Record<string, string> = {
  topup: 'Top-up',
  trial: 'Trial',
  allowance: 'Allowance',
  charge: 'Test run',
  refund: 'Refund',
  adjustment: 'Adjustment',
  chat: 'Chat',
}

const PAGE_SIZE = 5

// Paginated spend history. Debits ink; credit grants in ok green with "+".
export default function ActivityList({ entries }: { entries: Entry[] }) {
  const [page, setPage] = useState(0)
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const start = safePage * PAGE_SIZE
  const slice = entries.slice(start, start + PAGE_SIZE)

  if (entries.length === 0) {
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
        No activity yet.
      </section>
    )
  }

  return (
    <section style={{ border: `1px solid ${SX.hair}`, background: SX.paper }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: `1px solid ${SX.hair}`,
        }}
      >
        <Cap color={SX.soft} size={10}>
          Spend history
        </Cap>
        <Cap color={SX.faint} size={9} style={{ ...TNUM }}>
          {start + 1}–{Math.min(start + PAGE_SIZE, entries.length)} of {entries.length}
        </Cap>
      </div>

      {/* Column header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '120px 1fr 100px',
          gap: 14,
          padding: '8px 18px',
          background: SX.tint,
          borderBottom: `1px solid ${SX.hair}`,
        }}
      >
        <Cap color={SX.faint} size={9}>
          When
        </Cap>
        <Cap color={SX.faint} size={9}>
          Activity
        </Cap>
        <Cap color={SX.faint} size={9} style={{ textAlign: 'right' }}>
          Credits
        </Cap>
      </div>

      <div>
        {slice.map((e) => {
          const positive = e.amount > 0
          const label = REASON_LABEL[e.reason] ?? e.reason
          return (
            <div
              key={e.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr 100px',
                gap: 14,
                padding: '12px 18px',
                borderBottom: `1px solid ${SX.hairSoft}`,
                alignItems: 'center',
              }}
            >
              <div
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 11,
                  color: SX.faint,
                  ...TNUM,
                }}
              >
                {new Date(e.created_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: '2-digit',
                })}
              </div>
              <div
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 13,
                  color: SX.ink,
                  lineHeight: 1.4,
                }}
              >
                <strong style={{ fontWeight: 700 }}>{label}</strong>
                {e.note && (
                  <span style={{ color: SX.soft, fontWeight: 400 }}> · {e.note}</span>
                )}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  fontFamily: FONT.grotesque,
                  fontSize: 14,
                  fontWeight: 800,
                  color: positive ? SX.ok : SX.ink,
                  ...TNUM,
                }}
              >
                {positive ? '+' : ''}
                {e.amount.toLocaleString()}
              </div>
            </div>
          )
        })}
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 6,
            padding: '12px 18px',
          }}
        >
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setPage(i)}
              style={{
                width: 28,
                height: 28,
                border: `1px solid ${i === safePage ? SX.ink : SX.hair}`,
                background: i === safePage ? SX.ink : 'transparent',
                color: i === safePage ? SX.paper : SX.ink,
                fontFamily: FONT.grotesque,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                ...TNUM,
              }}
            >
              {i + 1}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
            disabled={safePage >= totalPages - 1}
            style={{
              width: 28,
              height: 28,
              border: `1px solid ${SX.hair}`,
              background: 'transparent',
              color: safePage >= totalPages - 1 ? SX.faint : SX.ink,
              cursor: safePage >= totalPages - 1 ? 'default' : 'pointer',
              fontFamily: FONT.grotesque,
              fontSize: 14,
            }}
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </section>
  )
}
