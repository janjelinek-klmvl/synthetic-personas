'use client'

import { IdeaType } from '@/lib/types'
import { SX, FONT } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

const IDEA_TYPES: { id: IdeaType; label: string; hint: string }[] = [
  { id: 'insight', label: 'Insight', hint: 'A human truth or tension to test as a stimulus.' },
  { id: 'proposition', label: 'Product proposition', hint: 'A new product, service, or feature concept.' },
  { id: 'campaign', label: 'Campaign idea', hint: 'A campaign, creative platform, or message.' },
]

interface Props {
  value: IdeaType | null
  onSelect: (id: IdeaType) => void
}

// Body of the Type drawer. Renders 3 selectable cards in a full-width row.
// Caller (composer) closes the drawer on select.
export default function IdeaTypeDrawer({ value, onSelect }: Props) {
  return (
    <div style={{ padding: '22px 26px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <Cap color={SX.soft} size={10}>
          Type · pick one
        </Cap>
        <Cap color={SX.faint} size={9}>
          Defines the brief schema
        </Cap>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${IDEA_TYPES.length}, 1fr)`,
          gap: 12,
        }}
      >
        {IDEA_TYPES.map((t) => {
          const selected = value === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              style={{
                textAlign: 'left',
                padding: '16px 16px 18px',
                border: `1.5px solid ${selected ? SX.accent : SX.hair}`,
                background: selected ? SX.accentSoft : 'transparent',
                cursor: 'pointer',
                transition: 'border-color 120ms, background 120ms',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!selected) (e.currentTarget as HTMLElement).style.borderColor = SX.ink
              }}
              onMouseLeave={(e) => {
                if (!selected) (e.currentTarget as HTMLElement).style.borderColor = SX.hair
              }}
            >
              <div
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 16,
                  fontWeight: 800,
                  letterSpacing: '-0.015em',
                  color: SX.ink,
                  lineHeight: 1.2,
                }}
              >
                {t.label}
              </div>
              <div
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 12,
                  color: SX.soft,
                  marginTop: 8,
                  lineHeight: 1.5,
                }}
              >
                {t.hint}
              </div>
              {selected && (
                <span
                  style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: SX.accent,
                    color: SX.paper,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 800,
                  }}
                  aria-hidden
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
