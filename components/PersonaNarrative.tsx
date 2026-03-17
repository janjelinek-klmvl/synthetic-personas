'use client'

interface QuotePerson {
  text:   string
  name:   string
  age:    number
  gender: string
  area:   string
}

interface Props {
  quotes: QuotePerson[]
}

const AVATAR_COLORS = [
  { bg: '#EEF3FF', text: '#4A7CF8' },
  { bg: '#FDF2F8', text: '#EC4899' },
  { bg: '#ECFDF5', text: '#10B981' },
  { bg: '#FFF8EC', text: '#F59E0B' },
]

const AREA_ICONS: Record<string, string> = {
  'big city': '🏙',
  'town':     '🏘',
  'village':  '🌾',
}

export default function PersonaNarrative({ quotes }: Props) {
  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        In their own words
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {quotes.slice(0, 4).map((q, i) => {
          const avatar = AVATAR_COLORS[i % AVATAR_COLORS.length]
          const initial = q.name ? q.name[0].toUpperCase() : '?'
          const areaIcon = AREA_ICONS[q.area?.toLowerCase()] ?? '📍'

          return (
            <div key={i} style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '18px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '14px',
            }}>

              {/* Quote body */}
              <div>
                {/* Decorative quote mark */}
                <div style={{
                  fontSize: '28px', lineHeight: 1,
                  color: 'var(--primary-light)',
                  fontWeight: 800,
                  marginBottom: '6px',
                  userSelect: 'none',
                }} aria-hidden>
                  &ldquo;
                </div>
                <p style={{
                  fontSize: '13px', lineHeight: 1.6,
                  color: 'var(--text-primary)',
                  margin: 0,
                }}>
                  {q.text}
                </p>
              </div>

              {/* Person identity */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                paddingTop: '12px',
                borderTop: '1px solid var(--border-subtle)',
              }}>
                {/* Avatar initial */}
                <div style={{
                  width: '28px', height: '28px',
                  borderRadius: '8px',
                  background: avatar.bg,
                  color: avatar.text,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {initial}
                </div>

                <div style={{ minWidth: 0 }}>
                  <div style={{
                    fontSize: '12px', fontWeight: 700,
                    color: 'var(--text-primary)', lineHeight: 1.2,
                  }}>
                    {q.name}
                  </div>
                  <div style={{
                    fontSize: '10px',
                    color: 'var(--text-tertiary)',
                    marginTop: '2px',
                    lineHeight: 1.3,
                  }}>
                    {q.age} · {q.gender} · {areaIcon} {q.area}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
