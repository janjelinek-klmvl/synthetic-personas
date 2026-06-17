import { CSSProperties, ReactNode } from 'react'
import { SX, FONT } from '@/lib/design/tokens'

// Caps label: uppercase, weight 700, ~0.14em tracking, 8–11px.
// Used for all kickers, field labels, status pips, etc.
interface CapProps {
  children: ReactNode
  color?: string
  size?: number
  ls?: string | number
  style?: CSSProperties
  as?: 'div' | 'span'
}

export default function Cap({
  children,
  color = SX.ink,
  size = 11,
  ls = '0.14em',
  style,
  as = 'div',
}: CapProps) {
  const Tag = as
  return (
    <Tag
      style={{
        fontFamily: FONT.grotesque,
        fontSize: size,
        fontWeight: 700,
        letterSpacing: ls,
        textTransform: 'uppercase',
        color,
        lineHeight: 1.35,
        ...style,
      }}
    >
      {children}
    </Tag>
  )
}
