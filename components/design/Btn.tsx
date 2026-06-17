'use client'

import { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react'
import { SX, FONT } from '@/lib/design/tokens'

interface BtnProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'style'> {
  children: ReactNode
  style?: CSSProperties
}

// Primary button: accent bg, paper text, uppercase 11px/700, padding 11/20.
// Square corners. Hover dims via brightness(0.92). Disabled → faint bg.
export function BtnPrimary({ children, disabled, style, className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      disabled={disabled}
      className={`sx-btn-primary ${className ?? ''}`.trim()}
      style={{
        cursor: disabled ? 'default' : 'pointer',
        border: 'none',
        background: disabled ? SX.faint : SX.accent,
        color: SX.paper,
        fontFamily: FONT.grotesque,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '11px 20px',
        transition: 'filter 120ms',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

// Ghost button: transparent w/ 1px ink border, ink text. Hover inverts.
export function BtnGhost({ children, style, className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={`sx-btn-ghost ${className ?? ''}`.trim()}
      style={{
        cursor: 'pointer',
        border: `1px solid ${SX.ink}`,
        background: 'transparent',
        color: SX.ink,
        fontFamily: FONT.grotesque,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        padding: '10px 18px',
        transition: 'background 120ms, color 120ms',
        ...style,
      }}
    >
      {children}
    </button>
  )
}
