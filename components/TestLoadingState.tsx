'use client'

import { useEffect, useState } from 'react'
import { useAudiences, accentMap } from '@/lib/personas'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

// Phase timing is approximate — AS only emits `loading`/`evaluating` on the
// real run, so we fake a progression. Durations roughly mirror real cost of
// each pipeline stage (coding open responses is the slowest because it makes
// one Claude call per respondent). Multi-audience runs scale linearly.
const PHASES: Array<{ label: string; ms: number }> = [
  { label: 'Synthesising respondents…', ms: 6000 },
  { label: 'Presenting the stimulus', ms: 12000 },
  { label: 'Coding open responses', ms: 45000 }, // slowest stage
  { label: 'Scoring the signals', ms: 25000 },
  { label: 'Writing the debrief', ms: 12000 },
]

interface Props {
  personaIds: string[]
  respondentCount: number
  audienceCount?: number
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('')
}

// Open-ended run loading screen. Five fake phases on a timer + a respondent
// grid that fills progressively. No completion CTA — the report opens on its
// own when polling sees the terminal status.
export default function TestLoadingState({ personaIds, respondentCount, audienceCount = 1 }: Props) {
  const { byId } = useAudiences()
  const [phase, setPhase] = useState(0)
  const [responded, setResponded] = useState<number>(0)

  // Phase advancement — each phase has its own duration. Multi-audience runs
  // scale all timings linearly because AS runs them sequentially per audience.
  const scale = Math.max(1, audienceCount)
  useEffect(() => {
    if (phase >= PHASES.length - 1) return
    const t = setTimeout(
      () => setPhase((p) => Math.min(p + 1, PHASES.length - 1)),
      PHASES[phase].ms * scale,
    )
    return () => clearTimeout(t)
  }, [phase, scale])

  // Respondent grid is exactly the count the user picked (6/12/18/24 × audiences).
  const N_RESPONDENTS = Math.max(1, respondentCount * Math.max(1, audienceCount))
  // Pace respondent fill so it spans the "Coding open responses" phase roughly:
  // total fill time ~ phase 3 duration. So each respondent takes phase3.ms/N.
  const fillIntervalMs = Math.max(1200, (PHASES[2].ms * scale) / N_RESPONDENTS)
  useEffect(() => {
    if (responded >= N_RESPONDENTS) return
    const t = setTimeout(() => setResponded((r) => Math.min(r + 1, N_RESPONDENTS)), fillIntervalMs)
    return () => clearTimeout(t)
  }, [responded, N_RESPONDENTS])

  const personaAccents = personaIds.map((id) => {
    const a = byId(id)
    if (!a) return accentMap.indigo
    return accentMap[a.accentColor] ?? accentMap.indigo
  })

  return (
    <div
      style={{
        maxWidth: 820,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        padding: '24px 0 16px',
      }}
    >
      {/* Header: pulse + caps */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="sx-pulse" style={{ display: 'inline-flex', gap: 4 }}>
          <span />
          <span />
          <span />
        </span>
        <Cap color={SX.ink} size={11}>
          Test in progress
        </Cap>
      </div>

      <h2
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 'clamp(28px, 4vw, 38px)',
          fontWeight: 800,
          color: SX.ink,
          letterSpacing: '-0.025em',
          lineHeight: 1.1,
          margin: 0,
          textWrap: 'balance',
        }}
      >
        Putting it to {respondentCount} synthetic respondents
        {audienceCount > 1 ? ` × ${audienceCount} audiences` : ''}.
      </h2>

      <p
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 14,
          lineHeight: 1.55,
          color: SX.soft,
          margin: 0,
          maxWidth: 540,
        }}
      >
        Each respondent reads your stimulus, answers in their own voice, and gets coded into the
        signals you picked. This takes a minute or two.
      </p>

      {/* Phase block */}
      <div style={{ marginTop: 8 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 17,
              fontWeight: 700,
              color: SX.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {PHASES[phase].label}
          </div>
          <Cap color={SX.faint} size={10} style={{ ...TNUM }}>
            Phase {String(phase + 1).padStart(2, '0')} / {String(PHASES.length).padStart(2, '0')}
          </Cap>
        </div>

        <div className="sx-loadbar" aria-hidden>
          <div className="sx-loadbar-fill" />
        </div>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {PHASES.map((p, i) => {
            const done = i < phase
            const cur = i === phase
            return (
              <div
                key={p.label}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  fontFamily: FONT.grotesque,
                  fontSize: 11,
                  fontWeight: cur ? 700 : 500,
                  color: done ? SX.accent : cur ? SX.ink : SX.faint,
                  letterSpacing: '0.02em',
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: done || cur ? SX.accent : SX.hair,
                  }}
                />
                {done ? <span style={{ color: SX.accent }}>✓</span> : null}
                {p.label}
              </div>
            )
          })}
        </div>
      </div>

      {/* Respondent grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
          gap: 8,
        }}
      >
        {Array.from({ length: N_RESPONDENTS }).map((_, i) => {
          const accent = personaAccents[i % Math.max(1, personaAccents.length)]
          const done = i < responded
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 12px',
                border: `1px solid ${done ? SX.accent : SX.hair}`,
                background: done ? SX.tint : 'transparent',
                transition: 'border-color 220ms, background 220ms',
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  background: accent.avatarBg,
                  color: accent.avatarText,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  flexShrink: 0,
                  fontFamily: FONT.grotesque,
                }}
                aria-hidden
              >
                {getInitials(`R${i + 1}`)}
              </span>
              <span
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: done ? SX.accent : SX.faint,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  flex: 1,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {done ? '✓ Responded' : 'Thinking…'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Closing reassurance */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 0 4px',
          borderTop: `1px solid ${SX.hairSoft}`,
        }}
      >
        <svg className="sx-spin" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="7" r="5.5" stroke={SX.hair} strokeWidth="1.5" fill="none" />
          <path d="M12.5 7a5.5 5.5 0 0 0-5.5-5.5" stroke={SX.accent} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
        <Cap color={SX.soft} size={10}>
          The reception report opens on its own when the run finishes — you can leave this open.
        </Cap>
      </div>
    </div>
  )
}
