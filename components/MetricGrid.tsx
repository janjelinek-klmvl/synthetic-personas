'use client'

import { useEffect, useState } from 'react'
import { QuantitativeMetric } from '@/lib/types'

const METRIC_META: Record<string, { label: string; color: string }> = {
  purchaseIntent:       { label: 'Purchase Intent',        color: '#4A7CF8' },
  desirability:         { label: 'Desirability',           color: '#EC4899' },
  uniqueness:           { label: 'Uniqueness',             color: '#A855F7' },
  valuePerception:      { label: 'Value Perception',       color: '#F59E0B' },
  emotionalResonance:   { label: 'Emotional Resonance',    color: '#F97316' },
  trustAdoptionBarrier: { label: 'Trust & Adoption',       color: '#EF4444' },
  relevancy:            { label: 'Relevancy',              color: '#10B981' },
  brandFit:             { label: 'Brand Fit',              color: '#6366F1' },
}

function MetricBar({ score, color, delay = 0 }: { score: number; color: string; delay?: number }) {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setWidth(score), delay)
    return () => clearTimeout(t)
  }, [score, delay])

  return (
    <div style={{ height: '3px', background: 'var(--border)', borderRadius: '9999px', overflow: 'hidden', marginTop: '10px' }}>
      <div style={{
        height: '100%', width: `${width}%`, background: color,
        borderRadius: '9999px', transition: 'width 900ms cubic-bezier(0.4,0,0.2,1)',
      }} />
    </div>
  )
}

interface Props {
  metrics: Record<string, QuantitativeMetric>
}

export default function MetricGrid({ metrics }: Props) {
  const entries = Object.entries(metrics) as [string, QuantitativeMetric][]

  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        Metric Breakdown
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {entries.map(([key, metric], i) => {
          const meta = METRIC_META[key] ?? { label: key, color: '#94A3B8' }
          const score = metric.score

          return (
            <div key={key} style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              borderTop: `3px solid ${meta.color}22`,
            }}>
              <div className="label-caps" style={{ color: meta.color, marginBottom: '10px', opacity: 0.8 }}>
                {meta.label}
              </div>
              <div style={{
                fontSize: '44px', fontWeight: 800, lineHeight: 1,
                letterSpacing: '-0.03em', color: meta.color,
              }}>
                {score}
                <span style={{ fontSize: '18px', fontWeight: 500, color: 'var(--text-tertiary)' }}>%</span>
              </div>
              <MetricBar score={score} color={meta.color} delay={150 + i * 60} />
              <p style={{
                fontSize: '12px', color: 'var(--text-secondary)',
                lineHeight: 1.5, marginTop: '10px',
              }}>
                {metric.evaluation}
              </p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
