'use client'

import { useEffect, useState } from 'react'
import { TestReport } from '@/lib/types'

interface Props {
  report: TestReport
  testTypeId: string
}

// ── Qualitative ──────────────────────────────────────────────
function ScoreBar({ value, delay = 0 }: { value: number; delay?: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth((value / 10) * 100), delay)
    return () => clearTimeout(t)
  }, [value, delay])

  const color = value >= 7 ? 'var(--primary)' : value >= 4 ? 'var(--yellow)' : 'var(--orange)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', width: '120px', flexShrink: 0 }}>
        Overall reaction
      </span>
      <div style={{ flex: 1, height: '4px', background: 'var(--border)', borderRadius: '9999px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${width}%`, background: color,
          borderRadius: '9999px', transition: 'width 700ms cubic-bezier(0.4,0,0.2,1)',
        }} />
      </div>
      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', width: '36px', textAlign: 'right' }}>
        {value}/10
      </span>
    </div>
  )
}

function QualitativeScore({ report }: { report: TestReport }) {
  const score = report.overallScore ?? 0
  const scoreColor = score >= 7 ? 'var(--primary)' : score >= 4 ? 'var(--yellow)' : 'var(--orange)'

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', marginBottom: '20px' }}>
        <span style={{ fontSize: '128px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: scoreColor }}>
          {score}
        </span>
        <span style={{ fontSize: '36px', fontWeight: 400, color: 'var(--text-tertiary)', marginBottom: '16px' }}>/10</span>
      </div>
      {report.summary && (
        <p style={{
          fontSize: '24px', fontWeight: 500, lineHeight: 1.4,
          color: 'var(--text-primary)', letterSpacing: '-0.02em',
          marginBottom: '32px', paddingLeft: '24px',
          borderLeft: '3px solid var(--primary)',
        }}>
          &ldquo;{report.summary}&rdquo;
        </p>
      )}
      <div style={{ paddingTop: '24px', borderTop: '1px solid var(--border-subtle)' }}>
        <ScoreBar value={score} delay={200} />
      </div>
    </div>
  )
}

// ── Quantitative ─────────────────────────────────────────────
function CompositeScore({ report }: { report: TestReport }) {
  const score = report.compositeScore ?? 0
  const scoreColor = score >= 70 ? 'var(--primary)' : score >= 45 ? 'var(--yellow)' : 'var(--orange)'

  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        Composite Score
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', marginBottom: '28px' }}>
        <span style={{ fontSize: '128px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: scoreColor }}>
          {score}
        </span>
        <span style={{ fontSize: '40px', fontWeight: 400, color: 'var(--text-tertiary)', marginBottom: '18px' }}>%</span>
      </div>
      {report.verdict && (
        <p style={{
          fontSize: '24px', fontWeight: 500, lineHeight: 1.4,
          color: 'var(--text-primary)', letterSpacing: '-0.02em',
          paddingLeft: '24px', borderLeft: '3px solid var(--primary)',
        }}>
          &ldquo;{report.verdict}&rdquo;
        </p>
      )}
    </div>
  )
}

export default function ScoreCard({ report, testTypeId }: Props) {
  if (testTypeId === 'quantitative') return <CompositeScore report={report} />
  return <QualitativeScore report={report} />
}
