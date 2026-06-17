'use client'

import { CSSProperties, forwardRef, ReactNode } from 'react'
import { SX, FONT, PAGE_W, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Props {
  chapterNumber: string // "01"
  kicker: string
  title: string
  note?: ReactNode
  children?: ReactNode
  style?: CSSProperties
}

// Chapter shell with a giant ghost number in the background + kicker + H2 + note.
const ChapterScaffold = forwardRef<HTMLElement, Props>(function ChapterScaffold(
  { chapterNumber, kicker, title, note, children, style },
  ref,
) {
  return (
    <section ref={ref} style={{ position: 'relative', paddingTop: 110, ...style }}>
      <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '0 48px', position: 'relative' }}>
        <div
          aria-hidden
          style={{
            position: 'absolute',
            right: 24,
            top: -28,
            fontFamily: FONT.grotesque,
            fontWeight: 800,
            fontSize: 230,
            lineHeight: 0.75,
            letterSpacing: '-0.05em',
            color: SX.ghost,
            zIndex: 0,
            pointerEvents: 'none',
            userSelect: 'none',
            ...(TNUM as CSSProperties),
          }}
        >
          {chapterNumber}
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Cap color={SX.accent} size={11.5}>
            {kicker}
          </Cap>
          <h2
            style={{
              margin: '16px 0 0',
              fontFamily: FONT.grotesque,
              fontWeight: 800,
              fontSize: 'clamp(36px, 5vw, 52px)',
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: SX.ink,
              maxWidth: 780,
              textWrap: 'balance',
            }}
          >
            {title}
          </h2>
          {note && (
            <p
              style={{
                margin: '18px 0 0',
                maxWidth: 620,
                fontFamily: FONT.grotesque,
                fontSize: 15,
                lineHeight: 1.55,
                color: SX.soft,
              }}
            >
              {note}
            </p>
          )}
        </div>
        {children}
      </div>
    </section>
  )
})

export default ChapterScaffold
