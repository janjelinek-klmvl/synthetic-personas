'use client'

interface IRLData {
  problemSolving:    string[]
  howAndWhenUsed:    string[]
  whatWouldStopThem: string[]
  lifestyleMatch:    string[]
}

interface Props {
  irl: IRLData
}

const CRITERIA = [
  {
    key:   'problemSolving' as const,
    label: 'Problem It Solves',
    icon:  '⚡',
    color: '#4A7CF8',
    bg:    '#EEF3FF',
  },
  {
    key:   'howAndWhenUsed' as const,
    label: 'How & When Used',
    icon:  '📅',
    color: '#10B981',
    bg:    '#EDFAF4',
  },
  {
    key:   'whatWouldStopThem' as const,
    label: 'What Would Stop Them',
    icon:  '🚧',
    color: '#EF4444',
    bg:    '#FEF2F2',
  },
  {
    key:   'lifestyleMatch' as const,
    label: 'Lifestyle Match',
    icon:  '🌱',
    color: '#A855F7',
    bg:    '#F6F0FF',
  },
]

export default function IRL({ irl }: Props) {
  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        In Real Life
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {CRITERIA.map(c => {
          const bullets = irl[c.key] ?? []
          return (
            <div key={c.key} style={{
              background: '#fff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              {/* Header strip */}
              <div style={{
                background: c.bg,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderBottom: `1px solid ${c.color}18`,
              }}>
                <span style={{ fontSize: '14px' }}>{c.icon}</span>
                <span style={{
                  fontSize: '10px', fontWeight: 700,
                  letterSpacing: '0.07em', textTransform: 'uppercase',
                  color: c.color,
                }}>
                  {c.label}
                </span>
              </div>

              {/* Bullets */}
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bullets.map((bullet, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{
                      width: '5px', height: '5px', borderRadius: '9999px',
                      background: c.color, flexShrink: 0, marginTop: '6px',
                    }} />
                    <p style={{
                      fontSize: '12px', color: 'var(--text-primary)',
                      lineHeight: 1.55, margin: 0,
                    }}>
                      {bullet}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
