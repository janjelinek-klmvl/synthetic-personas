'use client'

import { useState, useEffect, useRef } from 'react'
import { BriefQuestion } from '@/lib/types'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import Glyphs from '@/components/design/Glyphs'
import { BtnPrimary } from '@/components/design/Btn'

interface Props {
  question: BriefQuestion
  currentIndex: number
  total: number
  onAnswer: (answer: string) => void
  onSkip: () => void
  isLast: boolean
  onBack?: () => void
}

// "choice" is a back-compat alias for "single" (exclusive tile selection).
type QType = 'text' | 'list' | 'multi' | 'single'
function normalize(t: BriefQuestion['type']): QType {
  if (t === 'choice') return 'single'
  return t
}

export default function QuestionStep({
  question,
  currentIndex,
  total,
  onAnswer,
  onSkip,
  isLast,
  onBack,
}: Props) {
  const qType = normalize(question.type)

  const [textValue, setTextValue] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setTextValue('')
    setSelected([])
    if (qType === 'text' || qType === 'list') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [question.id, qType])

  function submitText() {
    if (textValue.trim()) onAnswer(textValue.trim())
    else onSkip()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && (qType === 'text' || qType === 'list')) {
      e.preventDefault()
      submitText()
    }
  }

  const canContinueTile =
    qType === 'multi' ? selected.length >= 1 : qType === 'single' ? selected.length === 1 : true

  function submitTiles() {
    if (qType === 'single') {
      if (selected[0]) onAnswer(selected[0])
    } else if (qType === 'multi') {
      if (selected.length > 0) onAnswer(selected.join(', '))
    }
  }

  function toggleTile(choice: string) {
    if (qType === 'single') setSelected([choice])
    else setSelected((s) => (s.includes(choice) ? s.filter((x) => x !== choice) : [...s, choice]))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Back link */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="sx-link"
          style={{
            alignSelf: 'flex-start',
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: FONT.grotesque,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SX.soft,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ fontSize: 14 }}>‹</span> Back
        </button>
      )}

      {/* Header: glyphs + caps + hairline + context */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <Glyphs size={12} />
        <Cap color={SX.ink} size={10.5}>
          Sharpening the brief
        </Cap>
        <span style={{ flex: 1, height: 1, background: SX.hair }} />
        <Cap color={SX.faint} size={9.5}>
          Idea × Audience
        </Cap>
      </div>

      {/* Segmented progress bar — one segment per question */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              height: 4,
              background: i <= currentIndex ? SX.accent : SX.hair,
              transition: 'background 200ms',
            }}
          />
        ))}
      </div>

      <Cap color={SX.faint} size={10} style={{ ...TNUM }}>
        Question {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </Cap>

      {/* Question */}
      <h2
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 'clamp(26px, 4vw, 38px)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          color: SX.ink,
          margin: 0,
          textWrap: 'balance',
        }}
      >
        {question.question}
      </h2>

      {/* Optional hint */}
      {question.hint && (
        <div
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 13,
            color: SX.soft,
            lineHeight: 1.55,
            marginTop: -16,
          }}
        >
          {question.hint}
        </div>
      )}

      {/* Answer */}
      {(qType === 'text' || qType === 'list') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {qType === 'list' && (
            <Cap color={SX.faint} size={9.5}>
              Comma-separated · several items welcome
            </Cap>
          )}
          <textarea
            ref={inputRef}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={qType === 'list' ? 'e.g. cost, switching effort, complexity' : 'Your answer…'}
            rows={qType === 'list' ? 2 : 4}
            className="sx-input"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `1px solid ${SX.ink}`,
              background: SX.paper,
              fontFamily: FONT.grotesque,
              fontSize: 15,
              lineHeight: 1.55,
              color: SX.ink,
              outline: 'none',
              resize: 'vertical',
              boxSizing: 'border-box',
              borderRadius: 0,
            }}
          />
        </div>
      )}

      {(qType === 'multi' || qType === 'single') && question.choices && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <Cap color={SX.soft} size={10}>
              {qType === 'multi' ? 'Select all that apply' : 'Pick one'}
            </Cap>
            {qType === 'multi' && (
              <Cap color={SX.accent} size={10} style={{ ...TNUM }}>
                {selected.length} selected
              </Cap>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10,
            }}
          >
            {question.choices.map((choice) => {
              const on = selected.includes(choice)
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => toggleTile(choice)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '14px 16px',
                    background: on ? SX.accentSoft : 'transparent',
                    border: `1.5px solid ${on ? SX.accent : SX.hair}`,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color 120ms, background 120ms',
                  }}
                  onMouseEnter={(e) => {
                    if (!on) (e.currentTarget as HTMLElement).style.borderColor = SX.ink
                  }}
                  onMouseLeave={(e) => {
                    if (!on) (e.currentTarget as HTMLElement).style.borderColor = SX.hair
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.grotesque,
                      fontSize: 14,
                      fontWeight: on ? 700 : 500,
                      color: on ? SX.ink : SX.soft,
                      lineHeight: 1.35,
                    }}
                  >
                    {choice}
                  </span>
                  {on && (
                    <span
                      aria-hidden
                      style={{
                        width: 16,
                        height: 16,
                        background: SX.accent,
                        color: SX.paper,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 9,
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer: Continue + Skip + caps note */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginTop: 8,
          flexWrap: 'wrap',
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          className="sx-link"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontFamily: FONT.grotesque,
            fontSize: 10,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SX.faint,
            cursor: 'pointer',
          }}
        >
          Skip
        </button>

        <Cap color={SX.faint} size={9}>
          Adaptive · questions come from your idea
        </Cap>

        <BtnPrimary
          onClick={qType === 'text' || qType === 'list' ? submitText : submitTiles}
          disabled={qType === 'multi' || qType === 'single' ? !canContinueTile : false}
        >
          {isLast ? 'Run test →' : 'Continue →'}
        </BtnPrimary>
      </div>
    </div>
  )
}
