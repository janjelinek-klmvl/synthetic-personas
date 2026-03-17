'use client'

import { useState } from 'react'
import IdeaInput from '@/components/IdeaInput'
import PersonaSelector from '@/components/PersonaSelector'
import TestTypeSelector from '@/components/TestTypeSelector'
import RunTestButton from '@/components/RunTestButton'
import ReportSection from '@/components/ReportSection'
import AppHeader from '@/components/AppHeader'
import { TestReport } from '@/lib/types'
import { saveEntry } from '@/lib/history'

export default function Home() {
  const [ideaText,          setIdeaText]          = useState('')
  const [fileContent,       setFileContent]       = useState<string | undefined>()
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null)
  const [selectedTestTypeId,setSelectedTestTypeId]= useState<string | null>(null)
  const [loading,           setLoading]           = useState(false)
  const [report,            setReport]            = useState<TestReport | null>(null)
  const [error,             setError]             = useState<string | null>(null)
  const [validationErrors,  setValidationErrors]  = useState<string[]>([])

  const canRun = ideaText.trim().length >= 20 && selectedPersonaId !== null && selectedTestTypeId !== null

  const validate = (): boolean => {
    const errors: string[] = []
    if (ideaText.trim().length < 20) errors.push('idea')
    if (!selectedPersonaId)          errors.push('persona')
    if (!selectedTestTypeId)         errors.push('testType')
    setValidationErrors(errors)
    return errors.length === 0
  }

  const handleRun = async () => {
    if (!validate()) return
    setLoading(true)
    setReport(null)
    setError(null)
    try {
      const res  = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaText:   ideaText.trim(),
          fileContent,
          personaId:  selectedPersonaId,
          testType:   selectedTestTypeId,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        setError(data.error ?? 'An unexpected error occurred.')
      } else {
        setReport(data.report)
        // Auto-save to history
        saveEntry({
          personaId:  selectedPersonaId!,
          testTypeId: selectedTestTypeId!,
          ideaText:   ideaText.trim(),
          report:     data.report,
        })
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const hasError = (field: string) => validationErrors.includes(field)

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>

      <AppHeader />

      {/* Hero */}
      <div className="max-w-2xl mx-auto px-6 pt-14 pb-12">
        <div className="tag tag-blue mb-5" style={{ width: 'fit-content' }}>AI-powered personas</div>
        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 52px)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-0.025em',
          color: 'var(--text-primary)',
          marginBottom: '16px',
        }}>
          How does your idea<br />land in the real world?
        </h1>
        <p style={{ fontSize: '17px', lineHeight: 1.6, color: 'var(--text-secondary)', maxWidth: '440px' }}>
          Pick a customer archetype, describe your idea, and get a structured reaction — as if you ran a focus group.
        </p>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6">

        {/* Step 01 — Choose a persona */}
        <section style={{ paddingBottom: '48px', marginBottom: '48px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '28px' }}>
            <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>01</span>
            <h2 style={{
              fontSize: '22px', fontWeight: 700, letterSpacing: '-0.015em',
              color: hasError('persona') ? 'var(--orange)' : 'var(--text-primary)',
            }}>
              Choose a persona
            </h2>
          </div>
          <PersonaSelector
            selectedId={selectedPersonaId}
            onSelect={id => {
              setSelectedPersonaId(id)
              setValidationErrors(e => e.filter(x => x !== 'persona'))
            }}
          />
        </section>

        {/* Step 02 — Describe your idea */}
        <section style={{ paddingBottom: '48px', marginBottom: '48px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '28px' }}>
            <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>02</span>
            <h2 style={{
              fontSize: '22px', fontWeight: 700, letterSpacing: '-0.015em',
              color: hasError('idea') ? 'var(--orange)' : 'var(--text-primary)',
            }}>
              Describe your idea
            </h2>
          </div>
          <IdeaInput
            value={ideaText}
            onChange={text => {
              setIdeaText(text)
              if (hasError('idea') && text.trim().length >= 20)
                setValidationErrors(e => e.filter(x => x !== 'idea'))
            }}
            fileContent={fileContent}
            onFileContent={(content, _name) => setFileContent(content)}
          />
        </section>

        {/* Step 03 — What do you want to measure? */}
        <section style={{ paddingBottom: '48px', marginBottom: '48px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', marginBottom: '28px' }}>
            <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>03</span>
            <h2 style={{
              fontSize: '22px', fontWeight: 700, letterSpacing: '-0.015em',
              color: hasError('testType') ? 'var(--orange)' : 'var(--text-primary)',
            }}>
              What do you want to measure?
            </h2>
          </div>
          <TestTypeSelector
            selectedId={selectedTestTypeId}
            onSelect={id => {
              setSelectedTestTypeId(id)
              setValidationErrors(e => e.filter(x => x !== 'testType'))
            }}
          />
        </section>

        {/* Run */}
        <section style={{ paddingBottom: '48px' }}>
          <RunTestButton loading={loading} disabled={!canRun} onClick={handleRun} />
        </section>

      </div>

      {/* Report */}
      <ReportSection report={report} loading={loading} testTypeId={selectedTestTypeId} error={error} />

      <footer className="max-w-2xl mx-auto px-6 py-10" style={{ borderTop: '1px solid var(--border-subtle)', marginTop: '32px' }}>
        <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>Powered by Claude — reactions are simulated, not real.</p>
      </footer>

    </div>
  )
}
