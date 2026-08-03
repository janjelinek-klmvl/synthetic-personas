import type { Metadata } from 'next'
import AppHeader from '@/components/AppHeader'
import Cap from '@/components/design/Cap'
import Glyphs from '@/components/design/Glyphs'
import { SX, FONT, PAGE_W } from '@/lib/design/tokens'

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
    img: '/about-report/verdict.png',
    alt: 'A Reception Debrief verdict: a 70-out-of-100 “Works” score, the headline “Identity door opens, trust floor missing,” and a radar of the scored dimensions.',
  },
  {
    term: 'Signals',
    body: 'The specific reactions behind that verdict — the strong and the weak.',
    img: '/about-report/signals.png',
    alt: 'The Signals chapter: every dimension scored on a 0–100 reception scale with meters, grouped by how it landed.',
  },
  {
    term: 'Evidence',
    body: 'Every signal traced to its source: which research, which data, which voice.',
    img: '/about-report/evidence.png',
    alt: 'The Evidence chapter: a coded theme shown with the respondents’ own words and the sources it affects.',
  },
  {
    term: 'Moves',
    body: 'What to do next: what to sharpen, what to drop.',
    img: '/about-report/moves.png',
    alt: 'The Moves chapter: three recommended moves, in order, each grounded in cited evidence.',
  },
  {
    term: 'Interrogate',
    body: 'You can interrogate any verdict by chat — ask why, and get an answer drawn from the same sources.',
    img: '/about-report/interrogate.png',
    alt: 'A chat box to interrogate the run — ask the report or the audience any question.',
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
            Each run produces a <strong style={{ color: SX.ink, fontWeight: 700 }}>Reception Debrief</strong> —
            here&apos;s one, chapter by chapter:
          </p>
        </Section>

        {/* ─── Reception Debrief — wide showcase band with real report fragments ── */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              .abt-dbf-grid { display: grid; grid-template-columns: 0.88fr 1.12fr; gap: 56px; align-items: center; }
              .abt-dbf-grid.flip { grid-template-columns: 1.12fr 0.88fr; }
              .abt-dbf-grid.flip .abt-dbf-text { order: 2; }
              .abt-dbf-grid.flip .abt-dbf-media { order: 1; }
              @media (max-width: 880px) {
                .abt-dbf-grid, .abt-dbf-grid.flip { grid-template-columns: 1fr; gap: 26px; }
                .abt-dbf-grid.flip .abt-dbf-text { order: 0; }
                .abt-dbf-grid.flip .abt-dbf-media { order: 1; }
              }
            `,
          }}
        />
        <div style={{ marginTop: 40 }}>
          {DEBRIEF.map((item, i) => (
            <div
              key={item.term}
              style={{
                padding: '56px 0',
                borderTop: i === 0 ? `2px solid ${SX.ink}` : `1px solid ${SX.hair}`,
              }}
            >
              <div className={`abt-dbf-grid${i % 2 === 1 ? ' flip' : ''}`}>
                <div className="abt-dbf-text">
                  <Cap color={SX.accent} size={11}>
                    {`0${i + 1} / 0${DEBRIEF.length}`}
                  </Cap>
                  <h3
                    style={{
                      margin: '14px 0 0',
                      fontFamily: FONT.grotesque,
                      fontWeight: 800,
                      fontSize: 'clamp(34px, 4.6vw, 50px)',
                      lineHeight: 0.98,
                      letterSpacing: '-0.04em',
                      color: SX.ink,
                    }}
                  >
                    {item.term}
                  </h3>
                  <div style={{ width: 44, height: 2, background: SX.accent, margin: '20px 0' }} />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: FONT.grotesque,
                      fontSize: 17,
                      lineHeight: 1.55,
                      color: SX.soft,
                      maxWidth: 420,
                    }}
                  >
                    {item.body}
                  </p>
                </div>

                <figure className="abt-dbf-media" style={{ margin: 0 }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.img}
                    alt={item.alt}
                    loading="lazy"
                    style={{
                      display: 'block',
                      width: '100%',
                      height: 'auto',
                      border: `1px solid ${SX.hair}`,
                      background: SX.paper,
                      boxShadow: '0 20px 44px rgba(26,23,20,0.10)',
                    }}
                  />
                </figure>
              </div>
            </div>
          ))}
        </div>

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
