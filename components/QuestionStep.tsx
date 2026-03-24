'use client'

import { useState, useEffect, useRef } from 'react'
import { BriefQuestion } from '@/lib/types'

interface Props {
  question: BriefQuestion
  currentIndex: number
  total: number
  onAnswer: (answer: string) => void
  onSkip: () => void
  isLast: boolean
}

export default function QuestionStep({ question, currentIndex, total, onAnswer, onSkip, isLast }: Props) {
  const [textValue, setTextValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const progress = ((currentIndex) / total) * 100

  // Reset text + focus when question changes
  useEffect(() => {
    setTextValue('')
    if (question.type === 'text') {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [question.id, question.type])

  function handleTextSubmit() {
    if (textValue.trim()) {
      onAnswer(textValue.trim())
    } else {
      onSkip()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }

  const actionLabel = isLast ? 'Run test →' : 'Next →'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* Progress */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div
          style={{
            flex: 1,
            height: '3px',
            background: '#e5e5e5',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: '#1a1a1a',
              borderRadius: '9999px',
              transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>
        <span style={{ fontSize: '12px', color: '#999', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
          {currentIndex + 1} / {total}
        </span>
      </div>

      {/* Question */}
      <div>
        <h2
          style={{
            fontSize: 'clamp(22px, 4vw, 32px)',
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#1a1a1a',
            margin: 0,
          }}
        >
          {question.question}
        </h2>
      </div>

      {/* Answer area */}
      {question.type === 'text' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            ref={inputRef}
            type="text"
            value={textValue}
            onChange={e => setTextValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={question.hint ?? 'Your answer…'}
            style={{
              padding: '14px 18px',
              borderRadius: '12px',
              border: '1.5px solid #e5e5e5',
              fontSize: '16px',
              color: '#1a1a1a',
              background: '#fff',
              outline: 'none',
              transition: 'border-color 0.15s',
              width: '100%',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            onFocus={e => { e.target.style.borderColor = '#1a1a1a' }}
            onBlur={e => { e.target.style.borderColor = '#e5e5e5' }}
          />

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <button
              type="button"
              onClick={onSkip}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: '13px',
                color: '#aaa',
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#666' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#aaa' }}
            >
              Skip
            </button>

            <button
              type="button"
              onClick={handleTextSubmit}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                background: '#1a1a1a',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.opacity = '0.85' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.opacity = '1' }}
            >
              {textValue.trim() ? actionLabel : 'Skip →'}
            </button>
          </div>
        </div>
      )}

      {question.type === 'choice' && question.choices && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {question.choices.map(choice => (
              <button
                key={choice}
                type="button"
                onClick={() => onAnswer(choice)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1.5px solid #e5e5e5',
                  background: '#fff',
                  color: '#1a1a1a',
                  fontSize: '14px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#1a1a1a'
                  el.style.background = '#1a1a1a'
                  el.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = '#e5e5e5'
                  el.style.background = '#fff'
                  el.style.color = '#1a1a1a'
                }}
              >
                {choice}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onSkip}
            style={{
              alignSelf: 'flex-start',
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: '13px',
              color: '#aaa',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#666' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#aaa' }}
          >
            Skip
          </button>
        </div>
      )}

    </div>
  )
}
