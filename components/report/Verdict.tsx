'use client'

import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { bandColor, type RecBand } from '@/lib/reception-colors'

interface Props {
  score: number
  band: RecBand
  bandLabel: string
  headline: string
  takeaways: string[]
  audienceName?: string | null
}

// Verdict block — the top of the Reception Debrief.
// Big score /100, band label (Works/Wobbles/Fails), headline + bulleted takeaways.
export default function Verdict({ score, band, bandLabel, headline, takeaways, audienceName }: Props) {
  const bandHex = bandColor(band)
  return (
    <section
      style={{
        borderTop: `2px solid ${bandHex}`,
        padding: '24px 0 28px',
        marginBottom: 32,
      }}
    >
      <Cap color={bandHex} size={11}>
        Verdict {audienceName ? `· ${audienceName}` : ''}
      </Cap>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: 40,
          alignItems: 'start',
          marginTop: 18,
        }}
      >
        {/* Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 84,
              fontWeight: 900,
              lineHeight: 0.9,
              color: SX.ink,
              letterSpacing: '-0.04em',
              ...TNUM,
            }}
          >
            {score}
            <span
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: SX.faint,
                letterSpacing: 0,
                marginLeft: 4,
                ...TNUM,
              }}
            >
              /100
            </span>
          </div>
          <div
            style={{
              marginTop: 10,
              padding: '4px 12px',
              background: bandHex,
              color: SX.paper,
              fontFamily: FONT.grotesque,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            {bandLabel}
          </div>
        </div>

        {/* Headline + takeaways */}
        <div>
          <p
            style={{
              fontFamily: FONT.serif,
              fontSize: 22,
              lineHeight: 1.3,
              color: SX.ink,
              margin: 0,
              fontWeight: 400,
              letterSpacing: '-0.005em',
            }}
          >
            {headline}
          </p>

          {takeaways.length > 0 && (
            <ul
              style={{
                margin: '20px 0 0 0',
                padding: 0,
                listStyle: 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              {takeaways.map((t, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    fontFamily: FONT.grotesque,
                    fontSize: 13.5,
                    color: SX.soft,
                    lineHeight: 1.5,
                  }}
                >
                  <span
                    aria-hidden
                    style={{
                      flexShrink: 0,
                      marginTop: 7,
                      width: 6,
                      height: 6,
                      background: bandHex,
                    }}
                  />
                  {t}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
