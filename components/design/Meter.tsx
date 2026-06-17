import { CSSProperties } from 'react'
import { SX } from '@/lib/design/tokens'

interface MeterProps {
  value: number // 0–100
  color?: string
  height?: number
  track?: string
  style?: CSSProperties
}

// Horizontal progress meter. 1px height by default; ink fill on hair track.
export default function Meter({
  value,
  color = SX.ink,
  height = 3,
  track = SX.hair,
  style,
}: MeterProps) {
  const v = Math.max(0, Math.min(100, value))
  return (
    <div style={{ position: 'relative', height, background: track, ...style }}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${v}%`,
          background: color,
        }}
      />
    </div>
  )
}
