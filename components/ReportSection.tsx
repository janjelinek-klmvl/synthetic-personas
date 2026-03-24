'use client'

import { useEffect, useRef, useState } from 'react'
import { CombinedTestReport, TestContext } from '@/lib/types'
import { getPersonaById } from '@/lib/personas'
import ScoreCard from './ScoreCard'
import MetricGrid from './MetricGrid'
import RadarChart from './RadarChart'
import RiskFlag from './RiskFlag'
import PushOver from './PushOver'
import CulturalRelevance from './CulturalRelevance'
import InsightsList from './InsightsList'
import PersonaNarrative from './PersonaNarrative'
import IRL from './IRL'
import Recommendations from './Recommendations'
import PersonaComparison from './PersonaComparison'
import PersonaChat from './PersonaChat'

interface Props {
  reports: CombinedTestReport[]
  loading: boolean
  error: string | null
  disableScroll?: boolean
  activePersonaId?: string | null
  onTabChange?: (id: string) => void
  ideaText?: string
  context?: TestContext
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {[0, 1].map(col => (
          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ width: '80px', height: '16px', background: 'var(--border)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '120px', height: '72px', background: 'var(--border)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ width: '100%', height: '14px', background: 'var(--border)', borderRadius: '6px', animation: 'pulse 1.5s ease-in-out infinite' }} />
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {[0, 1, 2, 3].map(row => (
          <div key={row} style={{ height: '80px', background: 'var(--border)', borderRadius: '12px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {[0, 1, 2, 3].map(row => (
          <div key={row} style={{ height: '14px', background: 'var(--border)', borderRadius: '6px', width: row === 3 ? '55%' : '100%', animation: 'pulse 1.5s ease-in-out infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}

export default function ReportSection({ reports, loading, error, disableScroll, activePersonaId, onTabChange, ideaText, context }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [chatOpen, setChatOpen] = useState(false)

  useEffect(() => {
    if (disableScroll) return
    if ((reports.length > 0 || loading) && ref.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [reports, loading, disableScroll])

  // Close chat when switching persona
  useEffect(() => { setChatOpen(false) }, [activePersonaId])

  if (reports.length === 0 && !loading && !error) return null

  const isMulti = reports.length > 1
  const activeReport = isMulti
    ? (reports.find(r => r.personaId === activePersonaId) ?? reports[0])
    : (reports[0] ?? null)

  const persona = activeReport ? getPersonaById(activeReport.personaId) : null
  const qual    = activeReport?.qualReport
  const quant   = activeReport?.quantReport

  return (
    <div ref={ref}>

      {/* Error */}
      {error && (
        <div style={{
          background: '#FFF0EE', border: '1px solid #FFD6CE',
          borderRadius: '12px', padding: '16px 20px',
          marginBottom: '32px', fontSize: '14px', color: 'var(--orange)',
        }}>
          {error}
        </div>
      )}

      {loading && <Skeleton />}

      {reports.length > 0 && !loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', paddingBottom: '16px' }}>

          {/* ── Multi-persona comparison overview ── */}
          {isMulti && (
            <PersonaComparison
              reports={reports}
              activePersonaId={activePersonaId ?? reports[0].personaId}
              onSelectPersona={onTabChange ?? (() => {})}
            />
          )}

          {/* ── Active persona report ── */}
          {activeReport && persona && qual && quant && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', paddingBottom: '16px' }}>

              {/* ── Dual scores — full width ── */}
              <ScoreCard qualReport={qual} quantReport={quant} />

              {/* ── Two-column split ── */}
              <div className="col-split">

                {/* Left — Qualitative */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {qual.resonates && qual.doesNotResonate && (
                    <InsightsList resonates={qual.resonates} doesNotResonate={qual.doesNotResonate} />
                  )}
                  {qual.quotes && qual.quotes.length > 0 && (
                    <PersonaNarrative quotes={qual.quotes} />
                  )}
                  {qual.irl && <IRL irl={qual.irl} />}
                  {qual.recommendations && <Recommendations recommendations={qual.recommendations} />}
                </div>

                {/* Right — Quantitative */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  {quant.metrics && (
                    <>
                      <MetricGrid metrics={quant.metrics} />
                      <RadarChart metrics={quant.metrics} />
                      {quant.riskFlag && <RiskFlag riskFlag={quant.riskFlag} />}
                      {quant.culturalRelevance && (
                        <CulturalRelevance culturalRelevance={quant.culturalRelevance} />
                      )}
                      {quant.pushOver && quant.pushOver.length > 0 && (
                        <PushOver items={quant.pushOver} />
                      )}
                    </>
                  )}
                </div>

              </div>

              {/* ── Chat button + panel ── */}
              {ideaText && context && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {!chatOpen ? (
                    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setChatOpen(true)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '8px',
                          padding: '11px 22px', borderRadius: '999px',
                          border: '1.5px solid #e5e5e5',
                          background: '#fff',
                          color: 'var(--text-primary)',
                          fontSize: '13px', fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = '#1a1a1a'
                          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.10)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = '#e5e5e5'
                          e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'
                        }}
                      >
                        <span style={{ fontSize: '16px' }}>{persona.emoji}</span>
                        Ask {persona.name.split(' ')[0]} follow-up questions
                      </button>
                    </div>
                  ) : (
                    <PersonaChat
                      persona={persona}
                      ideaText={ideaText}
                      context={context}
                    />
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      )}
    </div>
  )
}
