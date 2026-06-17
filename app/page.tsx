'use client'

import { useState, useRef, useEffect } from 'react'
import AppHeader from '@/components/AppHeader'
import PickCompanyLanding from '@/components/PickCompanyLanding'
import IdeaExtractionPanel, { type ExtractionState } from '@/components/IdeaExtractionPanel'
import { readFileForExtraction, type FileForExtraction } from '@/lib/fileParser'
import QuestionStep from '@/components/QuestionStep'
import SetupSummary from '@/components/SetupSummary'
import ReportSection from '@/components/ReportSection'
import BriefLoadingState from '@/components/BriefLoadingState'
import TestLoadingState from '@/components/TestLoadingState'
import DrawerTrigger from '@/components/composer/DrawerTrigger'
import IdeaTypeDrawer from '@/components/composer/IdeaTypeDrawer'
import AudienceDrawer from '@/components/composer/AudienceDrawer'
import ResearchScopeDrawer, { RESPONDENT_OPTIONS, type RespondentChoice } from '@/components/composer/ResearchScopeDrawer'
import { BtnPrimary } from '@/components/design/Btn'
import Cap from '@/components/design/Cap'
import { SX, FONT, PAGE_W, TNUM } from '@/lib/design/tokens'
import { IdeaType, IdeaBrief, BriefQuestion, BriefResponse, ExtractOutcome, ExtractIdeaSource } from '@/lib/types'
import { fieldsFor } from '@/lib/stimulus'
import { usePollingRun } from '@/lib/usePollingRun'
import { useAudiences } from '@/lib/personas'
import { estimateCredits } from '@/lib/estimate'

type Stage = 1 | 2 | 3
type DrawerId = 'type' | 'audience' | 'scope' | null

const FALLBACK_BRIEF: IdeaBrief = {}

const FALLBACK_QUESTIONS: BriefQuestion[] = [
  {
    id: 'fallback-1',
    parameter: 'gap',
    question: 'What single thing should be clearer before testing this?',
    type: 'text',
    hint: 'One sentence is fine',
  },
]

const TYPE_LABEL: Record<IdeaType, string> = {
  insight: 'Insight',
  proposition: 'Product proposition',
  campaign: 'Campaign idea',
}

export default function Home() {
  const [stage, setStage] = useState<Stage>(1)
  const [ideaText, setIdeaText] = useState('')
  const [fileContent, setFileContent] = useState<string | undefined>()
  const [personaIds, setPersonaIds] = useState<string[]>([])
  const [ideaType, setIdeaType] = useState<IdeaType | null>(null)
  const [selectedQuantIds, setSelectedQuantIds] = useState<string[] | null>(null)
  const [selectedQualIds, setSelectedQualIds] = useState<string[] | null>(null)
  const [respondentCount, setRespondentCount] = useState<RespondentChoice>(12)

  const [brief, setBrief] = useState<IdeaBrief>(FALLBACK_BRIEF)
  const [questions, setQuestions] = useState<BriefQuestion[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [questionsLoading, setQuestionsLoading] = useState(false)
  const [briefGenerated, setBriefGenerated] = useState<boolean | null>(null)

  const [runId, setRunId] = useState<string | null>(null)
  const [startError, setStartError] = useState<string | null>(null)
  const [showValidation, setShowValidation] = useState(false)

  const [activeDrawer, setActiveDrawer] = useState<DrawerId>(null)

  const droppedFile = useRef<FileForExtraction | null>(null)
  const [extraction, setExtraction] = useState<ExtractionState>({ status: 'idle' })
  const [extractionResult, setExtractionResult] = useState<
    | { filename: string; confidence: string; source_hint: string }
    | null
  >(null)
  const [dropTarget, setDropTarget] = useState(false)
  const dragCounter = useRef(0)

  const [needsPick, setNeedsPick] = useState<boolean | null>(null)
  useEffect(() => {
    let cancelled = false
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled) setNeedsPick(!!(d?.is_bnt_admin && !d?.company))
      })
      .catch(() => {
        if (!cancelled) setNeedsPick(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const reportRef = useRef<HTMLDivElement>(null)
  const polling = usePollingRun(runId)

  useEffect(() => {
    const handler = () => {
      setStage(1)
      setIdeaText('')
      setFileContent(undefined)
      setPersonaIds([])
      setIdeaType(null)
      setSelectedQuantIds(null)
      setSelectedQualIds(null)
      setRespondentCount(12)
      setBrief(FALLBACK_BRIEF)
      setQuestions([])
      setQuestionIndex(0)
      setBriefGenerated(null)
      setRunId(null)
      setStartError(null)
      setShowValidation(false)
      setExtraction({ status: 'idle' })
      setExtractionResult(null)
      setActiveDrawer(null)
      droppedFile.current = null
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
    window.addEventListener('sp-new-test', handler)
    return () => window.removeEventListener('sp-new-test', handler)
  }, [])

  const { audiences, quantMetrics, qualModules, pricing, balance } = useAudiences()
  const researchEmpty =
    selectedQuantIds !== null && selectedQuantIds.length === 0 &&
    selectedQualIds !== null && selectedQualIds.length === 0
  const effectiveQuantCount = selectedQuantIds?.length ?? quantMetrics.length
  const effectiveQualCount = selectedQualIds?.length ?? qualModules.length
  const estimatePerAudience = pricing
    ? estimateCredits(pricing.formula, {
        quant_metric_count: effectiveQuantCount,
        qual_module_count: effectiveQualCount,
        respondent_count: respondentCount,
        idea_char_length: ideaText.length,
      }).total
    : 0
  const totalEstimate = estimatePerAudience * Math.max(1, personaIds.length)
  const insufficientCredits = balance != null && totalEstimate > balance

  const canAdvance =
    ideaText.trim().length >= 20 &&
    personaIds.length > 0 &&
    ideaType !== null &&
    !researchEmpty &&
    !insufficientCredits

  function handleAdvanceToStage2() {
    if (!canAdvance) {
      setShowValidation(true)
      return
    }
    setShowValidation(false)
    setActiveDrawer(null)
    setBrief({})
    setQuestionIndex(0)
    setBriefGenerated(null)
    setStage(2)
    setQuestionsLoading(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    fetch('/api/brief', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ideaText: ideaText.trim(),
        ideaType,
        audienceId: personaIds[0],
        prefilledBrief: brief,
      }),
    })
      .then((r) => r.json() as Promise<BriefResponse>)
      .then((d) => {
        const incomingBrief = d.brief ?? {}
        setBrief(incomingBrief)
        setBriefGenerated(d.generated ?? false)
        if (d.generated && Array.isArray(d.questions) && d.questions.length === 0) {
          setQuestionsLoading(false)
          runTest(incomingBrief)
          return
        }
        const qs = Array.isArray(d.questions) && d.questions.length > 0 ? d.questions : FALLBACK_QUESTIONS
        setQuestions(qs)
        setQuestionsLoading(false)
      })
      .catch(() => {
        setQuestions(FALLBACK_QUESTIONS)
        setBriefGenerated(false)
        setQuestionsLoading(false)
      })
  }

  function handleAnswer(answer: string) {
    const q = questions[questionIndex]
    const value =
      q.type === 'list' ? answer.split(',').map((s) => s.trim()).filter(Boolean) : answer
    const newBrief = { ...brief, [q.parameter]: value }
    setBrief(newBrief)
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1)
    } else {
      runTest(newBrief)
    }
  }

  function handleSkip() {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex((i) => i + 1)
    } else {
      runTest(brief)
    }
  }

  // ── File-drop extraction ─────────────────────────────────
  async function extractFromFile(file: File) {
    setExtractionResult(null)
    setExtraction({ status: 'reading', filename: file.name })
    let payload: FileForExtraction
    try {
      payload = await readFileForExtraction(file)
    } catch (err) {
      setExtraction({
        status: 'failed',
        filename: file.name,
        message: err instanceof Error ? err.message : 'Could not read this file.',
      })
      return
    }
    droppedFile.current = payload
    await postExtraction(payload)
  }

  function sourceFromFile(payload: FileForExtraction): ExtractIdeaSource {
    if (payload.kind === 'text') return { kind: 'text', text: payload.text }
    if (payload.kind === 'document')
      return { kind: 'document', data_b64: payload.data_b64, media_type: payload.media_type }
    return { kind: 'image', data_b64: payload.data_b64, media_type: payload.media_type }
  }

  async function postExtraction(
    payload: FileForExtraction,
    extras?: { pick?: string; clarifications?: Record<string, string>; prior?: ExtractOutcome },
  ) {
    try {
      const res = await fetch('/api/extract-idea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: payload.filename,
          source: sourceFromFile(payload),
          pick: extras?.pick,
          clarifications: extras?.clarifications,
          prior: extras?.prior,
        }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setExtraction({
          status: 'failed',
          filename: payload.filename,
          message: body?.error ?? `Extraction failed (${res.status})`,
        })
        return
      }
      const outcome = (await res.json()) as ExtractOutcome
      handleExtractionOutcome(outcome, payload.filename)
    } catch (err) {
      setExtraction({
        status: 'failed',
        filename: payload.filename,
        message: err instanceof Error ? err.message : 'Network error',
      })
    }
  }

  function handleExtractionOutcome(outcome: ExtractOutcome, filename: string) {
    if (outcome.kind === 'single_idea') {
      setIdeaText(buildStructuredIdea(outcome.idea_text, outcome.idea_type, outcome.brief))
      setIdeaType(outcome.idea_type)
      setBrief(outcome.brief ?? {})
      setExtraction({ status: 'idle' })
      setExtractionResult({
        filename,
        confidence: outcome.confidence,
        source_hint: outcome.source_hint,
      })
      setShowValidation(false)
      return
    }
    if (outcome.kind === 'multiple_ideas') {
      setExtraction({
        status: 'pick_one',
        filename,
        candidates: outcome.candidates,
        prior: outcome,
      })
      return
    }
    if (outcome.kind === 'ambiguous') {
      setExtraction({
        status: 'clarifying',
        filename,
        partial: outcome.partial_idea,
        questions: outcome.clarifying_questions,
        prior: outcome,
      })
      return
    }
    setExtraction({
      status: 'failed',
      filename,
      message: outcome.reason ?? "We couldn't find a clear idea in this file.",
    })
  }

  function handlePick(id: string) {
    const f = droppedFile.current
    if (!f) return
    const prior = extraction.status === 'pick_one' ? extraction.prior : undefined
    setExtraction({ status: 'reading', filename: f.filename })
    void postExtraction(f, { pick: id, prior })
  }

  function handleClarify(answers: Record<string, string>) {
    const f = droppedFile.current
    if (!f) return
    const prior = extraction.status === 'clarifying' ? extraction.prior : undefined
    setExtraction({ status: 'reading', filename: f.filename })
    void postExtraction(f, { clarifications: answers, prior })
  }

  function cancelExtraction() {
    setExtraction({ status: 'idle' })
    droppedFile.current = null
  }

  async function runTest(finalBrief: IdeaBrief) {
    if (personaIds.length === 0 || !ideaType) return
    setStartError(null)
    setRunId(null)
    setStage(3)
    window.scrollTo({ top: 0, behavior: 'smooth' })

    try {
      const propRes = await fetch('/api/propositions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea: ideaText.trim(),
          idea_type: ideaType,
          brief: finalBrief,
          file_content: fileContent,
        }),
      })
      if (!propRes.ok) throw new Error(`proposition save failed: ${propRes.status}`)
      const proposition = await propRes.json()

      const runRes = await fetch('/api/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proposition_id: proposition.id,
          audience_ids: personaIds,
          respondent_count: respondentCount,
          quant_metric_ids: selectedQuantIds ?? undefined,
          qual_module_ids: selectedQualIds ?? undefined,
        }),
      })
      if (!runRes.ok) {
        const body = await runRes.json().catch(() => ({}))
        throw new Error(body?.error ?? `run start failed: ${runRes.status}`)
      }
      const { run_id } = await runRes.json()
      setRunId(run_id)
    } catch (err) {
      setStartError(err instanceof Error ? err.message : String(err))
    }
  }

  if (needsPick) {
    return (
      <div className="min-h-screen" style={{ background: SX.paper }}>
        <AppHeader />
        <PickCompanyLanding />
      </div>
    )
  }

  // ─── Stage 1: composer ──────────────────────────────────────────────
  if (stage === 1) {
    const ideaInvalid = showValidation && ideaText.trim().length < 20
    const personaInvalid = showValidation && personaIds.length === 0
    const typeInvalid = showValidation && !ideaType

    const audienceValue =
      personaIds.length === 0
        ? '—'
        : personaIds.length === 1
        ? audiences.find((a) => a.id === personaIds[0])?.name ?? '1 selected'
        : `${personaIds.length} selected`

    const scopeValue = (() => {
      const q = selectedQuantIds?.length ?? quantMetrics.length
      const m = selectedQualIds?.length ?? qualModules.length
      return `${q}m · ${m}q · ${respondentCount}r`
    })()

    return (
      <div className="min-h-screen" style={{ background: SX.paper }}>
        <AppHeader />

        <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '64px 48px 24px' }}>
          <Cap color={SX.accent} size={11.5}>
            New test
          </Cap>
          <h1
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 'clamp(36px, 5vw, 52px)',
              fontWeight: 800,
              lineHeight: 0.98,
              letterSpacing: '-0.035em',
              color: SX.ink,
              margin: '14px 0 18px',
              textWrap: 'balance',
            }}
          >
            How does your idea
            <br />
            land in the real world?
          </h1>
          <p
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 15,
              lineHeight: 1.55,
              color: SX.soft,
              maxWidth: 560,
              margin: 0,
            }}
          >
            Pick the type of idea you want to test and the audience to test it against. Then describe
            your idea, and get a research-grounded reaction.
          </p>
        </div>

        <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '0 48px 64px' }}>
          {extractionResult && extraction.status === 'idle' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 10,
                padding: '10px 14px',
                border: `1px solid ${SX.ok}`,
                background: 'rgba(28,140,91,0.08)',
                fontFamily: FONT.grotesque,
                fontSize: 12,
                color: SX.ok,
                lineHeight: 1.5,
              }}
            >
              <span style={{ flex: 1 }}>
                Extracted from <strong>{extractionResult.filename}</strong>{' '}
                <span style={{ opacity: 0.75 }}>
                  ({extractionResult.confidence} confidence
                  {extractionResult.source_hint ? ` · ${extractionResult.source_hint}` : ''})
                </span>{' '}
                — edit anything below before running.
              </span>
              <button
                type="button"
                onClick={() => setExtractionResult(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: SX.ok,
                  fontSize: 16,
                  cursor: 'pointer',
                  padding: 0,
                  lineHeight: 1,
                }}
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          {extraction.status !== 'idle' ? (
            <IdeaExtractionPanel
              state={extraction}
              onPick={handlePick}
              onAnswer={handleClarify}
              onCancel={cancelExtraction}
            />
          ) : (
            <div
              onDragEnter={(e) => {
                e.preventDefault()
                dragCounter.current += 1
                if (e.dataTransfer?.types?.includes('Files')) setDropTarget(true)
              }}
              onDragLeave={(e) => {
                e.preventDefault()
                dragCounter.current = Math.max(0, dragCounter.current - 1)
                if (dragCounter.current === 0) setDropTarget(false)
              }}
              onDragOver={(e) => {
                e.preventDefault()
                if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
              }}
              onDrop={(e) => {
                e.preventDefault()
                dragCounter.current = 0
                setDropTarget(false)
                const file = e.dataTransfer?.files?.[0]
                if (file) void extractFromFile(file)
              }}
              style={{
                background: SX.paper,
                border: dropTarget
                  ? `2px dashed ${SX.accent}`
                  : ideaInvalid
                  ? `1px solid ${SX.accent}`
                  : `1px solid ${SX.ink}`,
                position: 'relative',
                transition: 'border-color 120ms',
              }}
            >
              {dropTarget && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: SX.accentGhost,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                >
                  <Cap color={SX.accent} size={12}>
                    Drop file to extract idea
                  </Cap>
                </div>
              )}

              {/* Idea textarea */}
              <textarea
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
                placeholder="Describe your idea, product, campaign, or topic…"
                rows={5}
                className="sx-input"
                style={{
                  width: '100%',
                  padding: '22px 24px',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: FONT.grotesque,
                  fontSize: 16,
                  lineHeight: 1.55,
                  color: SX.ink,
                  background: 'transparent',
                  boxSizing: 'border-box',
                  borderRadius: 0,
                }}
              />

              {/* Toolbar row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '14px 18px',
                  borderTop: `1px solid ${SX.hair}`,
                  flexWrap: 'wrap',
                }}
              >
                <FilePickerButton onPick={(file) => void extractFromFile(file)} />

                <Cap color={SX.faint} size={10} style={{ ...TNUM }}>
                  {ideaText.length.toLocaleString()} chars
                </Cap>

                <div style={{ flex: 1 }} />

                <DrawerTrigger
                  label="Type"
                  value={ideaType ? TYPE_LABEL[ideaType] : 'Choose'}
                  active={activeDrawer === 'type'}
                  invalid={typeInvalid}
                  onClick={() => setActiveDrawer((d) => (d === 'type' ? null : 'type'))}
                />

                <DrawerTrigger
                  label="Audience"
                  value={audienceValue}
                  active={activeDrawer === 'audience'}
                  invalid={personaInvalid}
                  onClick={() => setActiveDrawer((d) => (d === 'audience' ? null : 'audience'))}
                />

                <DrawerTrigger
                  label="Scope"
                  value={scopeValue}
                  active={activeDrawer === 'scope'}
                  onClick={() => setActiveDrawer((d) => (d === 'scope' ? null : 'scope'))}
                />

                <BtnPrimary
                  onClick={handleAdvanceToStage2}
                  disabled={!canAdvance}
                  title={
                    researchEmpty
                      ? 'Pick at least one metric or module'
                      : insufficientCredits
                      ? `Not enough credits — needed ${totalEstimate.toLocaleString()}, have ${
                          balance?.toLocaleString() ?? 0
                        }. Ask your admin to top up.`
                      : undefined
                  }
                >
                  Run test →
                </BtnPrimary>
              </div>

              {/* Inline drawer — opens below the toolbar, full card width */}
              {activeDrawer && (
                <div style={{ borderTop: `1px solid ${SX.ink}` }}>
                  {activeDrawer === 'type' && (
                    <IdeaTypeDrawer
                      value={ideaType}
                      onSelect={(t) => {
                        setIdeaType(t)
                        setShowValidation(false)
                        setActiveDrawer(null)
                      }}
                    />
                  )}
                  {activeDrawer === 'audience' && (
                    <AudienceDrawer
                      value={personaIds}
                      onChange={(ids) => {
                        setPersonaIds(ids)
                        setShowValidation(false)
                      }}
                      onDone={() => setActiveDrawer(null)}
                    />
                  )}
                  {activeDrawer === 'scope' && (
                    <ResearchScopeDrawer
                      quantIds={selectedQuantIds}
                      qualIds={selectedQualIds}
                      respondentCount={respondentCount}
                      ideaCharLength={ideaText.length}
                      ideaType={ideaType}
                      audienceCount={personaIds.length}
                      onQuantChange={setSelectedQuantIds}
                      onQualChange={setSelectedQualIds}
                      onRespondentCountChange={(n) => {
                        // Coerce to one of the four locked options.
                        const valid = (RESPONDENT_OPTIONS as readonly number[]).includes(n)
                          ? (n as RespondentChoice)
                          : 12
                        setRespondentCount(valid)
                      }}
                      onConfirm={() => setActiveDrawer(null)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {showValidation && !canAdvance && (
            <Cap color={SX.accent} size={10} style={{ marginTop: 12 }}>
              {ideaInvalid ? 'Idea needs ≥20 chars. ' : ''}
              {typeInvalid ? 'Select a type. ' : ''}
              {personaInvalid ? 'Choose at least one audience. ' : ''}
              {insufficientCredits ? 'Not enough credits — ask your admin. ' : ''}
            </Cap>
          )}
        </div>
      </div>
    )
  }

  // ─── Stage 2: brief wizard ──────────────────────────────────────────
  if (stage === 2) {
    return (
      <div className="min-h-screen" style={{ background: SX.paper }}>
        <AppHeader />
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px' }}>
          {questionsLoading ? (
            <BriefLoadingState />
          ) : questions.length > 0 ? (
            <>
              {briefGenerated === false && (
                <div
                  style={{
                    marginBottom: 20,
                    padding: '10px 14px',
                    border: `1px solid ${SX.warn}`,
                    background: 'rgba(176,122,18,0.10)',
                    fontFamily: FONT.grotesque,
                    color: SX.warn,
                    fontSize: 12,
                    lineHeight: 1.5,
                  }}
                >
                  We couldn&apos;t analyse this idea automatically — using generic questions.
                </div>
              )}
              <QuestionStep
                key={questions[questionIndex].id}
                question={questions[questionIndex]}
                currentIndex={questionIndex}
                total={questions.length}
                onAnswer={handleAnswer}
                onSkip={handleSkip}
                isLast={questionIndex === questions.length - 1}
                onBack={() => setStage(1)}
              />
            </>
          ) : null}
        </div>
      </div>
    )
  }

  // ─── Stage 3: run + report ──────────────────────────────────────────
  const isRunning = polling.polling || (!polling.record && !startError && !!runId)
  const errorMessage = startError ?? polling.error

  return (
    <div className="min-h-screen" style={{ background: SX.paper }}>
      <AppHeader />

      <SetupSummary
        ideaText={ideaText}
        personaIds={personaIds}
        context={{ ideaType: ideaType!, brief }}
        onEdit={() => {
          setStage(1)
          setRunId(null)
          setStartError(null)
        }}
      />

      {isRunning && (
        <div ref={reportRef} style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '40px 48px 80px' }}>
          <TestLoadingState
            personaIds={personaIds}
            respondentCount={respondentCount}
            audienceCount={personaIds.length}
          />
        </div>
      )}
      {/* ReportSection (+ Debrief) manages its own width per chapter. */}
      {!isRunning && (
        <div ref={reportRef} style={{ padding: '40px 0 80px' }}>
          <ReportSection record={polling.record} loading={isRunning} error={errorMessage} />
        </div>
      )}
    </div>
  )
}

// After a file extraction, compose the textarea content from the distilled
// idea + a structured brief section.
function buildStructuredIdea(ideaText: string, ideaType: IdeaType, brief: IdeaBrief): string {
  const lines: string[] = []
  for (const def of fieldsFor(ideaType)) {
    const v = brief[def.key]
    if (def.kind === 'list') {
      const arr = Array.isArray(v) ? v : []
      const cleaned = arr.map((s) => String(s).trim()).filter(Boolean)
      if (cleaned.length === 0) continue
      lines.push(`${def.label}\n${cleaned.join(', ')}`)
    } else {
      if (typeof v !== 'string' || v.trim().length === 0) continue
      lines.push(`${def.label}\n${v.trim()}`)
    }
  }
  if (lines.length === 0) return ideaText.trim()
  return `${ideaText.trim()}\n\n— Brief —\n\n${lines.join('\n\n')}`
}

function FilePickerButton({ onPick }: { onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".pdf,.docx,.doc,.txt,.md,.png,.jpg,.jpeg,.webp,.gif"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onPick(f)
          e.target.value = ''
        }}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        title="Attach file (PDF, DOCX, TXT, image)"
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `1px solid ${SX.ink}`,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: SX.ink,
          flexShrink: 0,
          transition: 'background 120ms, color 120ms',
        }}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = SX.ink
          ;(e.currentTarget as HTMLElement).style.color = SX.paper
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLElement).style.background = 'transparent'
          ;(e.currentTarget as HTMLElement).style.color = SX.ink
        }}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>
    </>
  )
}
