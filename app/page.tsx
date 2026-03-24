'use client'

import { useState, useRef } from 'react'
import AppHeader from '@/components/AppHeader'
import IdeaInput from '@/components/IdeaInput'
import IdeaTypeDropdown from '@/components/IdeaTypeDropdown'
import PersonaDropdown from '@/components/PersonaDropdown'
import QuestionStep from '@/components/QuestionStep'
import SetupSummary from '@/components/SetupSummary'
import ReportSection from '@/components/ReportSection'
import { CombinedTestReport, IdeaType, TestContext, IdeaBrief, BriefQuestion } from '@/lib/types'
import { saveEntry } from '@/lib/history'

type Stage = 1 | 2 | 3

const FALLBACK_BRIEF: IdeaBrief = {}

const FALLBACK_QUESTIONS: BriefQuestion[] = [
  {
    id: 'fallback-1',
    parameter: 'coreBenefit',
    question: 'What is the core benefit for your target user?',
    type: 'text',
    hint: 'e.g. saves time, reduces cost, removes friction',
  },
  {
    id: 'fallback-2',
    parameter: 'revenueModel',
    question: 'What stage is this at?',
    type: 'choice',
    choices: ['Just an idea', 'MVP / prototype', 'Ready to launch'],
  },
]

export default function Home() {
  const [stage,            setStage]            = useState<Stage>(1)
  const [ideaText,         setIdeaText]         = useState('')
  const [fileContent,      setFileContent]      = useState<string | undefined>()
  const [personaIds,       setPersonaIds]       = useState<string[]>([])
  const [ideaType,         setIdeaType]         = useState<IdeaType | null>(null)

  // Stage 2 state
  const [brief,            setBrief]            = useState<IdeaBrief>(FALLBACK_BRIEF)
  const [questions,        setQuestions]        = useState<BriefQuestion[]>([])
  const [questionIndex,    setQuestionIndex]    = useState(0)
  const [questionsLoading, setQuestionsLoading] = useState(false)

  // Stage 3 state
  const [loading,          setLoading]          = useState(false)
  const [reports,          setReports]          = useState<CombinedTestReport[]>([])
  const [activePersonaId,  setActivePersonaId]  = useState<string | null>(null)
  const [error,            setError]            = useState<string | null>(null)
  const [showValidation,   setShowValidation]   = useState(false)

  const reportRef = useRef<HTMLDivElement>(null)

  const canAdvance = ideaText.trim().length >= 20 && personaIds.length > 0 && ideaType !== null

  // ── Stage 1 → Stage 2 ──────────────────────────────────────
  function handleAdvanceToStage2() {
    if (!canAdvance) { setShowValidation(true); return }
    setShowValidation(false)
    setBrief({})
    setQuestionIndex(0)
    setStage(2)
    setQuestionsLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ideaText: ideaText.trim(), ideaType, personaId: personaIds[0] }),
    })
      .then(r => r.json())
      .then(d => {
        setBrief(d.brief ?? {})
        setQuestions(Array.isArray(d.questions) && d.questions.length > 0 ? d.questions : FALLBACK_QUESTIONS)
        setQuestionsLoading(false)
      })
      .catch(() => {
        setQuestions(FALLBACK_QUESTIONS)
        setQuestionsLoading(false)
      })
  }

  // ── Answer / Skip helpers ──────────────────────────────────
  function handleAnswer(answer: string) {
    const q = questions[questionIndex]
    const newBrief = { ...brief, [q.parameter]: answer }
    setBrief(newBrief)
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(i => i + 1)
    } else {
      runTest(newBrief)
    }
  }

  function handleSkip() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(i => i + 1)
    } else {
      runTest(brief)
    }
  }

  // ── Run test (Stage 2 → Stage 3) ──────────────────────────
  async function runTest(finalBrief: IdeaBrief) {
    if (personaIds.length === 0 || !ideaType) return
    setLoading(true)
    setReports([])
    setActivePersonaId(personaIds[0])
    setError(null)
    setStage(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    const fullContext: TestContext = {
      ideaType,
      brief: finalBrief,
    }

    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaText:   ideaText.trim(),
          fileContent,
          personaIds,
          context:    fullContext,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'An unexpected error occurred.')
      } else {
        setReports(data.reports)
        saveEntry({
          personaIds,
          ideaType,
          ideaText:  ideaText.trim(),
          context:   fullContext,
          reports:   data.reports,
        })
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Stage 1: Setup & Input ──────────────────────────────────
  if (stage === 1) {
    const ideaInvalid    = showValidation && ideaText.trim().length < 20
    const personaInvalid = showValidation && personaIds.length === 0
    const typeInvalid    = showValidation && !ideaType

    return (
      <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
        <AppHeader />

        <div className="container-lg pt-14 pb-10">
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            color: 'var(--text-primary)',
            marginBottom: '12px',
          }}>
            How does your idea<br />land in the real world?
          </h1>
          <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '480px' }}>
            Pick type of the idea you want to test and customer persona. Then describe your idea, and get a structured reaction.
          </p>
        </div>

        <div className="container-lg pb-16">
          {/* Idea textarea with inline toolbar */}
          <div
            style={{
              background: '#fff',
              border: ideaInvalid ? '1.5px solid var(--orange)' : '1.5px solid #e5e5e5',
              borderRadius: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'border-color 0.15s',
            }}
          >
            <textarea
              value={ideaText}
              onChange={e => setIdeaText(e.target.value)}
              placeholder="Describe your idea, product, campaign, or topic..."
              rows={6}
              style={{
                width: '100%',
                padding: '20px',
                border: 'none',
                outline: 'none',
                resize: 'none',
                fontSize: '15px',
                lineHeight: 1.6,
                color: 'var(--text-primary)',
                background: 'transparent',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
                borderRadius: '16px 16px 0 0',
              }}
            />

            {/* Inline toolbar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 16px',
                borderTop: '1px solid #f0f0f0',
                flexWrap: 'wrap',
                borderRadius: '0 0 14px 14px',
                background: '#fff',
              }}
            >
              {/* File upload */}
              <IdeaInput
                value=""
                onChange={() => {}}
                fileContent={fileContent}
                onFileContent={(content) => setFileContent(content)}
                toolbarOnly
              />

              {/* Spacer */}
              <div style={{ flex: 1 }} />

              {/* Type of idea */}
              <div style={{ outline: typeInvalid ? '2px solid var(--orange)' : 'none', borderRadius: '20px' }}>
                <IdeaTypeDropdown
                  value={ideaType}
                  onChange={t => { setIdeaType(t); setShowValidation(false) }}
                />
              </div>

              {/* Persona */}
              <div style={{ outline: personaInvalid ? '2px solid var(--orange)' : 'none', borderRadius: '20px' }}>
                <PersonaDropdown
                  value={personaIds}
                  onChange={ids => { setPersonaIds(ids); setShowValidation(false) }}
                />
              </div>

              {/* Run test button */}
              <button
                type="button"
                onClick={handleAdvanceToStage2}
                style={{
                  padding: '8px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  background: canAdvance ? '#2D7A3A' : '#b0c9b4',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: canAdvance ? 'pointer' : 'default',
                  transition: 'background 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                Run test
              </button>
            </div>
          </div>

          {/* Validation hint */}
          {showValidation && !canAdvance && (
            <p style={{ fontSize: '13px', color: 'var(--orange)', marginTop: '10px' }}>
              {ideaInvalid ? 'Your idea needs at least 20 characters. ' : ''}
              {typeInvalid ? 'Select a type of idea. ' : ''}
              {personaInvalid ? 'Choose at least one persona. ' : ''}
            </p>
          )}
        </div>

      </div>
    )
  }

  // ── Stage 2: AI-driven finetuning ──────────────────────────
  if (stage === 2) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
        <AppHeader />

        <div className="container-sm pt-12 pb-16">
          {/* Back button */}
          <button
            type="button"
            onClick={() => setStage(1)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '13px',
              color: '#aaa',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              marginBottom: '48px',
              fontFamily: 'inherit',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#666' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#aaa' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          {questionsLoading ? (
            /* Loading state */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%',
                  border: '2px solid #1a1a1a', borderTopColor: 'transparent',
                  animation: 'spin 0.7s linear infinite', flexShrink: 0,
                }} />
                <span style={{ fontSize: '16px', color: '#888' }}>Reading your idea…</span>
                <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
              </div>
              {/* Skeleton */}
              <div style={{ height: '3px', background: '#f0f0f0', borderRadius: '9999px' }} />
              <div style={{ height: '36px', background: '#f0f0f0', borderRadius: '10px', width: '70%', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: '52px', background: '#f0f0f0', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
              <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
            </div>
          ) : questions.length > 0 ? (
            /* Question step */
            <QuestionStep
              key={questions[questionIndex].id}
              question={questions[questionIndex]}
              currentIndex={questionIndex}
              total={questions.length}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
              isLast={questionIndex === questions.length - 1}
            />
          ) : null}
        </div>
      </div>
    )
  }

  // ── Stage 3: Results ────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <AppHeader />

      {/* Setup summary strip */}
      <SetupSummary
        ideaText={ideaText}
        personaIds={personaIds}
        context={{ ideaType: ideaType!, brief }}
        onEdit={() => { setStage(1); setReports([]); setActivePersonaId(null); setError(null) }}
      />

      {/* Results */}
      <div ref={reportRef} className="container-xl py-10">
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px' }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%',
              border: '2px solid var(--primary)', borderTopColor: 'transparent',
              animation: 'spin 0.7s linear infinite',
            }} />
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Running your test across {personaIds.length} {personaIds.length === 1 ? 'persona' : 'personas'}…
            </span>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}
        <ReportSection
          reports={reports}
          loading={loading}
          error={error}
          activePersonaId={activePersonaId}
          onTabChange={setActivePersonaId}
          ideaText={ideaText.trim()}
          context={{ ideaType: ideaType!, brief }}
          disableScroll
        />
      </div>

    </div>
  )
}
