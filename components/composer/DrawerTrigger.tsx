'use client'

import { SX, FONT } from '@/lib/design/tokens'

interface DrawerTriggerProps {
  label: string // caps label, e.g. "TYPE"
  value: string // bold value, e.g. "Insight"
  active: boolean // is the drawer currently open?
  invalid?: boolean
  onClick: () => void
}

// Composer trigger pill: tiny caps label + bold value + chevron.
// Open state: ink border + tint bg + chevron rotated 180°.
export default function DrawerTrigger({ label, value, active, invalid, onClick }: DrawerTriggerProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px',
        border: `1px solid ${active || invalid ? SX.ink : SX.hair}`,
        background: active ? SX.tint : 'transparent',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'border-color 120ms, background 120ms',
        outline: invalid ? `1px solid ${SX.accent}` : undefined,
        outlineOffset: invalid ? 2 : undefined,
      }}
    >
      <span
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 9.5,
          fontWeight: 700,
          color: SX.faint,
          textTransform: 'uppercase',
          letterSpacing: '0.14em',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 13,
          fontWeight: 700,
          color: SX.ink,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
      <svg
        width="11"
        height="11"
        viewBox="0 0 12 12"
        fill="none"
        style={{
          opacity: 0.7,
          transform: active ? 'rotate(180deg)' : 'none',
          transition: 'transform 140ms',
        }}
      >
        <path
          d="M2 4l4 4 4-4"
          stroke={SX.ink}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
