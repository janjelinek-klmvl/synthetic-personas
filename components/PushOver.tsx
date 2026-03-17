'use client'

interface Props {
  items: string[]
}

export default function PushOver({ items }: Props) {
  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        What Would Push Them Over
      </div>
      <div style={{
        background: '#fff',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {items.map((item, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            padding: '16px 20px',
            borderBottom: i < items.length - 1 ? '1px solid var(--border-subtle)' : 'none',
          }}>
            {/* Number pill */}
            <div style={{
              width: '22px',
              height: '22px',
              borderRadius: '9999px',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              marginTop: '1px',
            }}>
              {i + 1}
            </div>
            <p style={{
              fontSize: '14px',
              color: 'var(--text-primary)',
              lineHeight: 1.55,
              margin: 0,
            }}>
              {item}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
