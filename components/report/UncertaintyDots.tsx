import { SX } from '@/lib/design/tokens'

interface Props {
  uncertainty?: string | null // 'low' | 'medium' | 'high' or unknown
}

// 1/2/3 ink dots representing uncertainty. Low → 1 filled, 2 hollow; etc.
// Unknown uncertainty → no dots.
export default function UncertaintyDots({ uncertainty }: Props) {
  if (!uncertainty) return null
  const u = uncertainty.toLowerCase()
  const filled = u === 'low' ? 1 : u === 'medium' ? 2 : u === 'high' ? 3 : 0
  if (filled === 0) return null
  return (
    <span
      title={`Uncertainty: ${uncertainty}`}
      style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}
      aria-label={`Uncertainty ${uncertainty}`}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            background: i < filled ? SX.ink : 'transparent',
            border: `1px solid ${SX.ink}`,
          }}
        />
      ))}
    </span>
  )
}
