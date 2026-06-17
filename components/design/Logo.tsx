import { SX, FONT } from '@/lib/design/tokens'

interface LogoProps {
  size?: number
}

// Wordmark "Synthetic" (Archivo 800) with a vermilion period.
export default function Logo({ size = 20 }: LogoProps) {
  return (
    <div
      style={{
        fontFamily: FONT.grotesque,
        fontWeight: 800,
        fontSize: size,
        letterSpacing: '-0.02em',
        color: SX.ink,
        lineHeight: 1,
      }}
    >
      Synthetic<span style={{ color: SX.accent }}>.</span>
    </div>
  )
}
