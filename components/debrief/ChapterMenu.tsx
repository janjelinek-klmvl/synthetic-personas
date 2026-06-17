'use client'

import { SX, FONT, PAGE_W } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

export interface Chapter {
  id: string
  n: string
  t: string
}

interface Props {
  chapters: Chapter[]
  active: string
  progress: number // 0..1
  onJump: (id: string) => void
}

// Sticky chapter navigation bar. Progress meter on top, chapter anchors below.
export default function ChapterMenu({ chapters, active, progress, onJump }: Props) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 56, // below AppHeader
        zIndex: 25,
        background: SX.paper,
        borderBottom: `1px solid ${SX.ink}`,
      }}
    >
      <div style={{ position: 'relative', height: 2 }}>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${progress * 100}%`,
            background: SX.accent,
            transition: 'width 120ms',
          }}
        />
      </div>
      <div
        style={{
          maxWidth: PAGE_W,
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          height: 50,
          overflowX: 'auto',
        }}
      >
        <Cap color={SX.faint} size={9.5} style={{ marginRight: 'auto', whiteSpace: 'nowrap' }}>
          Reception Debrief
        </Cap>
        {chapters.map((c) => {
          const on = active === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onJump(c.id)}
              style={{
                cursor: 'pointer',
                border: 'none',
                background: 'transparent',
                display: 'flex',
                alignItems: 'baseline',
                gap: 5,
                padding: '6px 9px',
                borderBottom: `2px solid ${on ? SX.accent : 'transparent'}`,
                fontFamily: FONT.grotesque,
                whiteSpace: 'nowrap',
                transition: 'border-color 120ms',
              }}
            >
              <span
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 8.5,
                  fontWeight: 700,
                  color: SX.accent,
                  letterSpacing: '0.14em',
                }}
              >
                {c.n}
              </span>
              <span
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 9.5,
                  fontWeight: 700,
                  color: on ? SX.ink : SX.soft,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {c.t}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
