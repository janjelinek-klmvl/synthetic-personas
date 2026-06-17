import { CSSProperties, ReactNode } from 'react'
import { PAGE_W } from '@/lib/design/tokens'

interface WrapProps {
  children: ReactNode
  w?: number
  style?: CSSProperties
}

// Centered content wrapper — max 1140px, 48px gutters.
export default function Wrap({ children, w = PAGE_W, style }: WrapProps) {
  return (
    <div style={{ maxWidth: w, margin: '0 auto', padding: '0 48px', ...style }}>
      {children}
    </div>
  )
}
