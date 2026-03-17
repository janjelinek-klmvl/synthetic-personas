'use client'

interface Props {
  resonates: string[]
  doesNotResonate: string[]
}

export default function InsightsList({ resonates, doesNotResonate }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

      {/* What lands */}
      <div>
        <div className="tag tag-blue" style={{ marginBottom: '20px', width: 'fit-content' }}>What lands</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {resonates.map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{
                flexShrink: 0,
                width: '20px',
                height: '20px',
                borderRadius: '9999px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1px',
              }}>+</span>
              <span style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--text-primary)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* What doesn't land */}
      <div>
        <div className="tag tag-orange" style={{ marginBottom: '20px', width: 'fit-content' }}>What doesn&apos;t land</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {doesNotResonate.map((item, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{
                flexShrink: 0,
                width: '20px',
                height: '20px',
                borderRadius: '9999px',
                background: 'var(--orange-light)',
                color: 'var(--orange)',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: '1px',
              }}>−</span>
              <span style={{ fontSize: '14px', lineHeight: 1.55, color: 'var(--text-primary)' }}>{item}</span>
            </li>
          ))}
        </ul>
      </div>

    </div>
  )
}
