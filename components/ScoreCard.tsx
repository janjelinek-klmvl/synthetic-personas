'use client'

import { useEffect, useState } from 'react'
import { TestReport } from '@/lib/types'

// ── Qualitative score bar ─────────────────────────────────────
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

// ── Combined dual scores ──────────────────────────────────────
interface DualScoreProps {
  qualReport: TestReport
  quantReport: TestReport
}

export default function ScoreCard({ qualReport, quantReport }: DualScoreProps) {
  const qualScore  = qualReport.overallScore ?? 0
  const quantScore = quantReport.compositeScore ?? 0

  const qualColor  = qualScore >= 7  ? 'var(--primary)' : qualScore >= 4  ? 'var(--yellow)' : 'var(--orange)'
  const quantColor = quantScore >= 70 ? 'var(--primary)' : quantScore >= 45 ? 'var(--yellow)' : 'var(--orange)'

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

      {/* Qualitative score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          Sentiment
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px' }}>
          <span style={{ fontSize: '80px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: qualColor }}>
            {qualScore}
          </span>
          <span style={{ fontSize: '28px', fontWeight: 400, color: 'var(--text-tertiary)', marginBottom: '10px' }}>/10</span>
        </div>
        {qualReport.summary && (
          <p style={{
            fontSize: '16px', fontWeight: 500, lineHeight: 1.5,
            color: 'var(--text-primary)', letterSpacing: '-0.01em',
            paddingLeft: '14px', borderLeft: '2px solid var(--primary)',
          }}>
            &ldquo;{qualReport.summary}&rdquo;
          </p>
        )}
        <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
          <ScoreBar value={qualScore} delay={200} />
        </div>
      </div>

      {/* Quantitative score */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="label-caps" style={{ color: 'var(--text-tertiary)' }}>
          Concept Score
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px' }}>
          <span style={{ fontSize: '80px', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.05em', color: quantColor }}>
            {quantScore}
          </span>
          <span style={{ fontSize: '28px', fontWeight: 400, color: 'var(--text-tertiary)', marginBottom: '10px' }}>%</span>
        </div>
        {quantReport.verdict && (
          <p style={{
            fontSize: '16px', fontWeight: 500, lineHeight: 1.5,
            color: 'var(--text-primary)', letterSpacing: '-0.01em',
            paddingLeft: '14px', borderLeft: '2px solid var(--primary)',
          }}>
            &ldquo;{quantReport.verdict}&rdquo;
          </p>
        )}
      </div>

    </div>
  )
}
