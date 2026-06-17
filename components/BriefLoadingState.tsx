'use client'

import { useEffect, useState } from 'react'
import { SX, FONT } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

const MESSAGES = [
  'Reading your idea…',
  'Extracting key assumptions…',
  'Identifying your audience…',
  'Crafting your questions…',
]

export default function BriefLoadingState() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIndex((i) => (i + 1) % MESSAGES.length)
        setVisible(true)
      }, 200)
    }, 1600)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      <Cap color={SX.accent} size={11}>
        Sharpening the brief
      </Cap>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <span className="sx-pulse" style={{ display: 'inline-flex', gap: 4 }}>
          <span />
          <span />
          <span />
        </span>

        <span
          key={msgIndex}
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 15,
            fontWeight: 600,
            color: SX.ink,
            letterSpacing: '-0.005em',
            transition: 'opacity 200ms',
            opacity: visible ? 1 : 0,
          }}
        >
          {MESSAGES[msgIndex]}
        </span>
      </div>

      {/* Indeterminate sliding bar */}
      <div className="sx-loadbar" aria-hidden>
        <div className="sx-loadbar-fill" />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ height: 22, background: SX.hairSoft, width: '65%' }} />
        <div style={{ height: 52, background: SX.hairSoft }} />
      </div>
    </div>
  )
}
