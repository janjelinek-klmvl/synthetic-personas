import { SX } from '@/lib/design/tokens'

interface GlyphsProps {
  size?: number
  gap?: number
}

// Three small squares used as a brand mark in panels: accent filled, ink
// outlined, soft outlined.
export default function Glyphs({ size = 16, gap = 3 }: GlyphsProps) {
  const gs = [SX.accent, SX.ink, SX.soft]
  return (
    <div style={{ display: 'flex', gap }}>
      {gs.map((g, i) => (
        <span
          key={i}
          style={{
            width: size,
            height: size,
            background: i === 0 ? g : 'transparent',
            border: `1.5px solid ${g}`,
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}
