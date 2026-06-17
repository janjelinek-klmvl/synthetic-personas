'use client'

import { useState } from 'react'
import type { ChatMode } from '@/lib/types-as'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Props {
  disabled: boolean
  audienceAvailable: boolean
  maxRespondents: number
  onSubmit: (content: string, mode: ChatMode, respondentCount?: number) => void
}

export default function ChatComposer({ disabled, audienceAvailable, maxRespondents, onSubmit }: Props) {
  const [mode, setMode] = useState<ChatMode>('report')
  const [text, setText] = useState('')
  const [respondents, setRespondents] = useState<number>(Math.max(1, Math.min(10, maxRespondents)))

  const canSubmit = !disabled && text.trim().length > 0 && (mode === 'report' || audienceAvailable)

  function submit() {
    if (!canSubmit) return
    const content = text.trim()
    setText('')
    onSubmit(content, mode, mode === 'audience' ? respondents : undefined)
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      style={{
        borderTop: `1px solid ${SX.ink}`,
        background: SX.paper,
        flex: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Mode row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderBottom: `1px solid ${SX.hair}`,
          flexWrap: 'wrap',
        }}
      >
        <Cap color={SX.soft} size={9.5}>
          Who are you asking
        </Cap>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          <ModeChip on={mode === 'report'} onClick={() => setMode('report')}>
            The Report
          </ModeChip>
          <ModeChip
            on={mode === 'audience'}
            onClick={() => audienceAvailable && setMode('audience')}
            disabled={!audienceAvailable}
          >
            The Audience
          </ModeChip>
        </div>
        {mode === 'audience' && audienceAvailable && (
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Cap color={SX.soft} size={9.5}>
              Respondents
            </Cap>
            <input
              type="number"
              min={1}
              max={maxRespondents}
              value={respondents}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (Number.isFinite(n)) setRespondents(Math.max(1, Math.min(maxRespondents, n)))
              }}
              className="sx-input"
              style={{
                width: 56,
                padding: '4px 8px',
                border: `1px solid ${SX.ink}`,
                fontFamily: FONT.grotesque,
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'right',
                background: SX.paper,
                outline: 'none',
                borderRadius: 0,
                ...TNUM,
              }}
            />
            <Cap color={SX.faint} size={9} style={{ ...TNUM }}>
              / {maxRespondents}
            </Cap>
          </label>
        )}
      </div>

      {/* Textarea + send */}
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 0 }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={
            mode === 'report'
              ? 'Ask anything about the report — biggest risk, segment differences, what to test next…'
              : 'Ask the audience a follow-up question — they answer in their own voice.'
          }
          rows={3}
          disabled={disabled}
          className="sx-input"
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '14px 16px',
            fontFamily: FONT.grotesque,
            fontSize: 13.5,
            lineHeight: 1.5,
            color: SX.ink,
            resize: 'vertical',
            borderRadius: 0,
          }}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="sx-btn-primary"
          style={{
            cursor: canSubmit ? 'pointer' : 'default',
            border: 'none',
            background: canSubmit ? SX.accent : SX.faint,
            color: SX.paper,
            fontFamily: FONT.grotesque,
            fontWeight: 800,
            fontSize: 11,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            padding: '0 22px',
            flex: 'none',
          }}
        >
          Ask
        </button>
      </div>

      <div style={{ padding: '8px 16px 10px', borderTop: `1px solid ${SX.hair}` }}>
        <Cap color={SX.faint} size={9}>
          {mode === 'report'
            ? 'Free of audience-pricing · 1 credit per turn'
            : `~${Math.ceil(2 + 0.5 * respondents)} credits · ${respondents} respondents`}
        </Cap>
      </div>
    </div>
  )
}

function ModeChip({
  on,
  onClick,
  disabled,
  children,
}: {
  on: boolean
  onClick: () => void
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1px solid ${on ? SX.ink : SX.hair}`,
        background: on ? SX.ink : 'transparent',
        color: on ? SX.paper : SX.soft,
        fontFamily: FONT.grotesque,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '5px 10px 6px',
        opacity: disabled ? 0.45 : 1,
        transition: 'background 120ms, color 120ms, border-color 120ms',
      }}
    >
      {children}
    </button>
  )
}
