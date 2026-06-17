'use client'

import { useEffect, useState } from 'react'
import type { BriefQuestion, ExtractCandidate, ExtractOutcome } from '@/lib/types'

export type ExtractionState =
  | { status: 'idle' }
  | { status: 'reading'; filename: string }
  | { status: 'pick_one'; filename: string; candidates: ExtractCandidate[]; prior: ExtractOutcome }
  | {
      status: 'clarifying'
      filename: string
      partial: string
      questions: BriefQuestion[]
      prior: ExtractOutcome
    }
  | { status: 'failed'; filename?: string; message: string }

interface Props {
  state: ExtractionState
  onPick: (id: string) => void
  onAnswer: (answers: Record<string, string>) => void
  onCancel: () => void
}

export default function IdeaExtractionPanel({ state, onPick, onAnswer, onCancel }: Props) {
  if (state.status === 'idle') return null

  if (state.status === 'reading') return <ReadingState filename={state.filename} />

  if (state.status === 'pick_one') {
    return (
      <PickOneState
        filename={state.filename}
        candidates={state.candidates}
        onPick={onPick}
        onCancel={onCancel}
      />
    )
  }

  if (state.status === 'clarifying') {
    return (
      <ClarifyingState
        filename={state.filename}
        partial={state.partial}
        questions={state.questions}
        onAnswer={onAnswer}
        onCancel={onCancel}
      />
    )
  }

  // failed
  return <FailedState message={state.message} filename={state.filename} onCancel={onCancel} />
}

// ── Reading ───────────────────────────────────────────────────────────

function ReadingState({ filename }: { filename: string }) {
  const messages = [
    `Reading ${filename}…`,
    'Understanding the idea…',
    'Pre-filling the brief…',
  ]
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % messages.length), 1800)
    return () => clearInterval(t)
  }, [messages.length])

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 28 }}>
        <Spinner />
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{messages[i]}</div>
          <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
            Claude is reasoning about your document. Usually takes 3–8 seconds.
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Pick one ──────────────────────────────────────────────────────────

function PickOneState({
  filename,
  candidates,
  onPick,
  onCancel,
}: {
  filename: string
  candidates: ExtractCandidate[]
  onPick: (id: string) => void
  onCancel: () => void
}) {
  return (
    <div style={panelStyle}>
      <div style={{ padding: 20 }}>
        <PanelHeader
          eyebrow={`From ${filename}`}
          title={`We found ${candidates.length} ideas. Pick the one you want to test:`}
          onCancel={onCancel}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
          {candidates.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onPick(c.id)}
              style={candidateStyle}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = '#e5e5e5')}
            >
              <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a', lineHeight: 1.4 }}>
                {c.summary}
              </div>
              {c.source_hint && (
                <div style={{ fontSize: 11, color: '#888', marginTop: 6 }}>{c.source_hint}</div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Clarifying ────────────────────────────────────────────────────────

function ClarifyingState({
  filename,
  partial,
  questions,
  onAnswer,
  onCancel,
}: {
  filename: string
  partial: string
  questions: BriefQuestion[]
  onAnswer: (answers: Record<string, string>) => void
  onCancel: () => void
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const allAnswered = questions.every((q) => answers[q.id]?.trim().length)

  function set(qid: string, val: string) {
    setAnswers((a) => ({ ...a, [qid]: val }))
  }

  return (
    <div style={panelStyle}>
      <div style={{ padding: 20 }}>
        <PanelHeader
          eyebrow={`From ${filename}`}
          title="We need a bit more context to lock the idea."
          onCancel={onCancel}
        />

        {partial && (
          <div
            style={{
              marginTop: 14,
              padding: '10px 12px',
              background: '#f5f5f5',
              borderRadius: 10,
              fontSize: 13,
              color: '#444',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Best guess so far
            </span>
            <div style={{ marginTop: 4 }}>{partial}</div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16 }}>
          {questions.map((q) => (
            <div key={q.id}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', marginBottom: 6 }}>
                {q.question}
              </div>
              {q.type === 'choice' && q.choices ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {q.choices.map((c) => {
                    const on = answers[q.id] === c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => set(q.id, c)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 999,
                          border: '1.5px solid ' + (on ? '#1a1a1a' : '#e5e5e5'),
                          background: on ? '#1a1a1a' : '#fff',
                          color: on ? '#fff' : '#1a1a1a',
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'all 0.1s',
                        }}
                      >
                        {c}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <input
                  type="text"
                  value={answers[q.id] ?? ''}
                  onChange={(e) => set(q.id, e.target.value)}
                  placeholder={q.hint ?? 'Your answer…'}
                  style={inputStyle}
                />
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancel} style={linkBtnStyle}>
            Skip — type it manually
          </button>
          <button
            type="button"
            disabled={!allAnswered}
            onClick={() => onAnswer(answers)}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: allAnswered ? '#1a1a1a' : '#d1d1d1',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: allAnswered ? 'pointer' : 'default',
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Failed ────────────────────────────────────────────────────────────

function FailedState({
  message,
  filename,
  onCancel,
}: {
  message: string
  filename?: string
  onCancel: () => void
}) {
  return (
    <div style={panelStyle}>
      <div style={{ padding: 20 }}>
        <PanelHeader
          eyebrow={filename ? `From ${filename}` : 'Could not extract'}
          title="Couldn't find a clear idea in this file."
          onCancel={onCancel}
        />
        <p style={{ fontSize: 13, color: '#666', marginTop: 12, lineHeight: 1.5 }}>{message}</p>
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '9px 18px',
              borderRadius: 10,
              border: 'none',
              background: '#1a1a1a',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Type it manually
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────

function PanelHeader({
  eyebrow,
  title,
  onCancel,
}: {
  eyebrow: string
  title: string
  onCancel: () => void
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4 }}>
          {eyebrow}
        </div>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a', margin: '6px 0 0', letterSpacing: '-0.01em' }}>
          {title}
        </h3>
      </div>
      <button type="button" onClick={onCancel} style={closeBtnStyle} aria-label="Cancel">
        ×
      </button>
    </div>
  )
}

function Spinner() {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        border: '2px solid #d6d6d6',
        borderTopColor: '#1a1a1a',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        flexShrink: 0,
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  border: '1.5px solid #e5e5e5',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
}

const candidateStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  textAlign: 'left',
  padding: 14,
  background: '#fafafa',
  border: '1.5px solid #e5e5e5',
  borderRadius: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
  transition: 'border-color 0.1s',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid #e5e5e5',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
  background: '#fff',
  boxSizing: 'border-box',
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#888',
  fontSize: 13,
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
}

const closeBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  borderRadius: 14,
  border: 'none',
  background: '#f5f5f5',
  fontSize: 18,
  color: '#666',
  cursor: 'pointer',
  lineHeight: 1,
  flexShrink: 0,
}
