'use client'

import { useEffect, useRef } from 'react'
import { TestReport } from '@/lib/types'
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

interface Props {
  report: TestReport | null
  loading: boolean
  testTypeId: string | null
  error: string | null
  disableScroll?: boolean
}

function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <div style={{ width: '80px', height: '80px', background: 'var(--border)', borderRadius: '12px', marginBottom: '16px', animation: 'pulse 1.5s ease-in-out infinite' }} />
        <div style={{ width: '60%', height: '20px', background: 'var(--border)', borderRadius: '8px', animation: 'pulse 1.5s ease-in-out infinite' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {[0, 1].map(col => (
          <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ width: '80px', height: '24px', background: 'var(--border)', borderRadius: '999px', animation: 'pulse 1.5s ease-in-out infinite' }} />
            {[0, 1, 2].map(row => (
              <div key={row} style={{ height: '14px', background: 'var(--border)', borderRadius: '6px', width: row === 2 ? '70%' : '100%', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
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

export default function ReportSection({ report, loading, testTypeId, error, disableScroll }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (disableScroll) return
    if ((report || loading) && ref.current) {
      setTimeout(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100)
    }
  }, [report, loading, disableScroll])

  if (!report && !loading && !error) return null

  const persona = report ? getPersonaById(report.personaId) : null

  return (
    <div ref={ref} className="max-w-2xl mx-auto px-6">

      {/* Section divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '48px 0 40px' }}>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        <span className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          {loading ? 'Thinking...' : 'Report'}
        </span>
        <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
      </div>

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

      {report && !loading && persona && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px', paddingBottom: '16px' }}>

          {/* ── Composite score / overall score + verdict/summary ── */}
          <ScoreCard report={report} testTypeId={testTypeId ?? 'qualitative'} />

          {/* ── QUANTITATIVE sections ─────────────────────────────── */}
          {report.testType === 'quantitative' && report.metrics && (
            <>
              {/* Metric 2x2 grid */}
              <MetricGrid metrics={report.metrics} />

              {/* Radar chart */}
              <RadarChart metrics={report.metrics} />

              {/* Risk flag */}
              {report.riskFlag && <RiskFlag riskFlag={report.riskFlag} />}

              {/* Cultural Relevance */}
              {report.culturalRelevance && (
                <CulturalRelevance culturalRelevance={report.culturalRelevance} />
              )}

              {/* What would push them over */}
              {report.pushOver && report.pushOver.length > 0 && (
                <PushOver items={report.pushOver} />
              )}
            </>
          )}

          {/* ── QUALITATIVE sections ──────────────────────────────── */}
          {report.testType === 'qualitative' && (
            <>
              {report.resonates && report.doesNotResonate && (
                <InsightsList resonates={report.resonates} doesNotResonate={report.doesNotResonate} />
              )}
              {report.quotes && report.quotes.length > 0 && (
                <PersonaNarrative quotes={report.quotes} />
              )}
              {report.irl && <IRL irl={report.irl} />}
              {report.recommendations && <Recommendations recommendations={report.recommendations} />}
            </>
          )}

        </div>
      )}
    </div>
  )
}
