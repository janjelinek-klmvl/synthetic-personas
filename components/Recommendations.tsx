'use client'

interface Recommendation { title: string; description: string }
interface Props { recommendations: Recommendation[] }

export default function Recommendations({ recommendations }: Props) {
  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '24px' }}>
        Recommendations
      </div>
      <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {recommendations.map((rec, i) => (
          <li key={i} style={{
            display: 'flex',
            gap: '20px',
            background: '#fff',
            borderRadius: '16px',
            padding: '20px 24px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}>
            {/* Number */}
            <span style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'var(--primary-light)',
              flexShrink: 0,
              width: '36px',
              marginTop: '2px',
              fontVariantNumeric: 'tabular-nums',
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            <div style={{ paddingTop: '2px' }}>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                {rec.title}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6 }}>
                {rec.description}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
