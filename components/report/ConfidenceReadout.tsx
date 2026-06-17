import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import type { SignalConfidence, Level } from '@/lib/confidence'

const dotsFor = (level: Level) => (level === 'high' ? 3 : level === 'moderate' ? 2 : 1)

// Neutral (ink) dots on purpose — confidence must not read as a reception
// band colour (works/wobbles/fails own ok/warn/accent).
function Dots({ level }: { level: Level }) {
  const filled = dotsFor(level)
  return (
    <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }} aria-label={`${filled} of 3`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: i < filled ? SX.ink : 'transparent',
            border: `1px solid ${SX.ink}`,
          }}
        />
      ))}
    </span>
  )
}

function Pillar({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <Cap color={SX.faint} size={9}>
        {label}
      </Cap>
      <div style={{ textAlign: 'right', minWidth: 0 }}>
        <span
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 13,
            fontWeight: 700,
            color: SX.ink,
          }}
        >
          {value}
        </span>
        {note && (
          <span
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 11,
              color: SX.faint,
              marginLeft: 6,
            }}
          >
            {note}
          </span>
        )}
      </div>
    </div>
  )
}

// Two transparent pillars (backed-by-data + model certainty) plus the combined band.
export default function ConfidenceReadout({ confidence }: { confidence: SignalConfidence }) {
  const sources = `${confidence.evidenceCount} ${confidence.evidenceCount === 1 ? 'source' : 'sources'}`
  const modelNote = confidence.modelRated ? `self-rated ${confidence.modelRaw} uncertainty` : 'not rated'
  return (
    <div style={{ maxWidth: 460 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Dots level={confidence.overall} />
        <span
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: '-0.01em',
            color: SX.ink,
            ...(TNUM as React.CSSProperties),
          }}
        >
          {confidence.overallLabel}
        </span>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          marginTop: 12,
          paddingTop: 12,
          borderTop: `1px solid ${SX.hair}`,
        }}
      >
        <Pillar label="Backed by data" value={confidence.evidenceLabel} note={sources} />
        <Pillar label="Model certainty" value={confidence.modelLabel} note={modelNote} />
      </div>
    </div>
  )
}
