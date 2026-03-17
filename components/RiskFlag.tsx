'use client'

const METRIC_LABELS: Record<string, string> = {
  purchaseIntent:       'Purchase Intent',
  desirability:         'Desirability',
  uniqueness:           'Uniqueness',
  valuePerception:      'Value Perception',
  emotionalResonance:   'Emotional Resonance',
  trustAdoptionBarrier: 'Trust & Adoption',
  relevancy:            'Relevancy',
  brandFit:             'Brand Fit',
}

const METRIC_COLORS: Record<string, string> = {
  purchaseIntent:       '#4A7CF8',
  desirability:         '#EC4899',
  uniqueness:           '#A855F7',
  valuePerception:      '#F59E0B',
  emotionalResonance:   '#F97316',
  trustAdoptionBarrier: '#EF4444',
  relevancy:            '#10B981',
  brandFit:             '#6366F1',
}

interface Props {
  riskFlag: {
    metric: string
    explanation: string
  }
}

export default function RiskFlag({ riskFlag }: Props) {
  const label  = METRIC_LABELS[riskFlag.metric] ?? riskFlag.metric
  const color  = METRIC_COLORS[riskFlag.metric] ?? '#94A3B8'

  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        Key Risk
      </div>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'grid',
        gridTemplateColumns: '140px 1fr',
      }}>
        {/* Left — metric name */}
        <div style={{
          background: `${color}12`,
          borderRight: `1px solid ${color}22`,
          padding: '28px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '8px',
        }}>
          <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color }}>
            Weakest
          </div>
          <div style={{
            fontSize: '18px',
            fontWeight: 800,
            lineHeight: 1.2,
            color,
            letterSpacing: '-0.02em',
          }}>
            {label}
          </div>
          {/* Decorative bar */}
          <div style={{
            marginTop: '6px',
            height: '3px',
            width: '40px',
            borderRadius: '9999px',
            background: color,
            opacity: 0.4,
          }} />
        </div>

        {/* Right — explanation */}
        <div style={{ padding: '28px 24px', display: 'flex', alignItems: 'center' }}>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-primary)',
            lineHeight: 1.65,
            margin: 0,
            fontWeight: 400,
          }}>
            {riskFlag.explanation}
          </p>
        </div>
      </div>
    </div>
  )
}
