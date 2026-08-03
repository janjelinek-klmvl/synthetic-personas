import type { Metadata } from 'next'
import AppHeader from '@/components/AppHeader'
import Cap from '@/components/design/Cap'
import Glyphs from '@/components/design/Glyphs'
import { SX, FONT, PAGE_W, TNUM } from '@/lib/design/tokens'

export const metadata: Metadata = {
  title: 'About — Synthetic',
  description: 'Synthetic turns the evidence you already have into an audience you can test ideas against.',
}

// Reading column width for prose — nested inside the 1140 page wrap.
const READ_W = 760

const DEBRIEF = [
  {
    term: 'Verdict',
    body: 'Where the idea lands, in plain language.',
  },
  {
    term: 'Signals',
    body: 'The specific reactions behind that verdict — the strong and the weak.',
  },
  {
    term: 'Evidence',
    body: 'Every signal traced to its source: which research, which data, which voice.',
  },
  {
    term: 'Moves',
    body: 'What to do next: what to sharpen, what to drop.',
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen" style={{ background: SX.paper }}>
      <AppHeader />

      <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '56px 48px 112px' }}>
        {/* ─── Hero ─────────────────────────────────────────── */}
        <header style={{ borderTop: `2px solid ${SX.accent}`, paddingTop: 14, maxWidth: READ_W }}>
          <Cap color={SX.accent} size={11}>
            About Synthetic
          </Cap>
          <h1
            style={{
              margin: '16px 0 22px',
              fontFamily: FONT.grotesque,
              fontSize: 52,
              fontWeight: 800,
              letterSpacing: '-0.035em',
              color: SX.ink,
              lineHeight: 0.98,
            }}
          >
            An audience for
            <br />
            your ideas.
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: FONT.grotesque,
              fontSize: 19,
              lineHeight: 1.55,
              color: SX.soft,
              maxWidth: 620,
            }}
          >
            Synthetic turns the evidence you already have into an audience you can test ideas
            against — and gives you back a verdict you can trace to its source.
          </p>
        </header>

        {/* ─── Glass box pull-statement ─────────────────────── */}
        <section
          style={{
            margin: '72px 0',
            paddingLeft: 28,
            borderLeft: `2px solid ${SX.accent}`,
            maxWidth: READ_W,
          }}
        >
          <Glyphs size={13} />
          <p
            style={{
              margin: '20px 0 0',
              fontFamily: FONT.serif,
              fontSize: 30,
              fontWeight: 400,
              lineHeight: 1.32,
              letterSpacing: '-0.01em',
              color: SX.ink,
            }}
          >
            It&apos;s a glass box, not a black box. Every result shows its reasoning and the
            evidence behind it, so you can always see{' '}
            <em style={{ fontStyle: 'italic', color: SX.accent }}>why</em> an idea landed the way
            it did.
          </p>
        </section>

        {/* ─── What it does ─────────────────────────────────── */}
        <Section kicker="What it does">
          <p style={proseStyle}>
            You bring an idea — a proposition, a feature, a piece of messaging. Synthetic rehearses
            how it lands against an audience: a sourced, graded model of the people you care about,
            built from real research and data.
          </p>
          <p style={{ ...proseStyle, marginTop: 20 }}>
            Each run produces a <strong style={{ color: SX.ink, fontWeight: 700 }}>Reception Debrief</strong>:
          </p>

          <div style={{ marginTop: 44, maxWidth: READ_W }}>
            {DEBRIEF.map((item, i) => (
              <div
                key={item.term}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  padding: '44px 0',
                  borderTop: i === 0 ? `2px solid ${SX.ink}` : `1px solid ${SX.hair}`,
                }}
              >
                {/* Giant ghost index — echoes the report's chapter scaffold. */}
                <span
                  aria-hidden
                  style={{
                    position: 'absolute',
                    right: -6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontFamily: FONT.grotesque,
                    fontWeight: 800,
                    fontSize: 168,
                    lineHeight: 0.7,
                    letterSpacing: '-0.06em',
                    color: SX.ghost,
                    zIndex: 0,
                    pointerEvents: 'none',
                    userSelect: 'none',
                    ...TNUM,
                  }}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>

                <div style={{ position: 'relative', zIndex: 1, maxWidth: 500 }}>
                  <Cap color={SX.accent} size={11}>
                    {`0${i + 1} / 04`}
                  </Cap>
                  <h3
                    style={{
                      margin: '14px 0 0',
                      fontFamily: FONT.grotesque,
                      fontWeight: 800,
                      fontSize: 'clamp(32px, 4.6vw, 46px)',
                      lineHeight: 0.98,
                      letterSpacing: '-0.04em',
                      color: SX.ink,
                    }}
                  >
                    {item.term}
                  </h3>
                  <div style={{ width: 40, height: 2, background: SX.accent, margin: '18px 0' }} />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: FONT.grotesque,
                      fontSize: 16.5,
                      lineHeight: 1.55,
                      color: SX.soft,
                      maxWidth: 440,
                    }}
                  >
                    {item.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p style={{ ...proseStyle, marginTop: 28 }}>
            You can interrogate any verdict by chat — ask why, and get an answer drawn from the same
            sources.
          </p>
        </Section>

        {/* ─── What an audience is ──────────────────────────── */}
        <Section kicker="What an audience is">
          <p style={proseStyle}>
            Not a fixed panel. An audience is a constructed model — a graded distribution of
            synthetic respondents, built by BNT analysts from deep research, population data, and
            (where you provide it) your own studies and data.
          </p>

          <div
            style={{
              marginTop: 28,
              maxWidth: READ_W,
              background: SX.tint,
              border: `1px solid ${SX.hair}`,
              padding: '24px 26px',
            }}
          >
            <Cap color={SX.accent} size={10} style={{ marginBottom: 10 }}>
              Evidence label
            </Cap>
            <p
              style={{
                margin: 0,
                fontFamily: FONT.grotesque,
                fontSize: 16,
                lineHeight: 1.55,
                color: SX.ink,
              }}
            >
              Every audience carries an evidence label: what it&apos;s made of, how fresh it is, and
              where it&apos;s thin — so you always know how far to lean on it.
            </p>
          </div>
        </Section>

        {/* ─── What it isn't ────────────────────────────────── */}
        <Section kicker="What it isn't" muted>
          <p style={{ ...proseStyle, color: SX.soft }}>
            Synthetic doesn&apos;t predict what people will do. It makes explicit what your evidence
            implies — and shows the work. It&apos;s a rehearsal layer to sharpen ideas before you
            commit to fieldwork, not a replacement for research or for your judgement.
          </p>
        </Section>
      </div>
    </div>
  )
}

// Section wrapper — accent kicker over a hairline, matching the app's
// section-header rhythm.
function Section({
  kicker,
  muted,
  children,
}: {
  kicker: string
  muted?: boolean
  children: React.ReactNode
}) {
  return (
    <section style={{ marginTop: 72, maxWidth: READ_W }}>
      <div
        style={{
          borderTop: `1px solid ${muted ? SX.hair : SX.ink}`,
          paddingTop: 16,
          marginBottom: 22,
        }}
      >
        <Cap color={muted ? SX.faint : SX.ink} size={11}>
          {kicker}
        </Cap>
      </div>
      {children}
    </section>
  )
}

const proseStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: FONT.grotesque,
  fontSize: 16.5,
  lineHeight: 1.6,
  color: SX.ink,
  maxWidth: READ_W,
}
