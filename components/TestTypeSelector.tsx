'use client'

import { testTypes } from '@/lib/testTypes'

interface Props {
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function TestTypeSelector({ selectedId, onSelect }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
      {testTypes.map(type => {
        const selected = selectedId === type.id
        const isQuantitative = type.id === 'quantitative'

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            style={{
              textAlign: 'left',
              padding: '20px',
              borderRadius: '16px',
              border: `1.5px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
              background: selected ? '#fff' : 'transparent',
              cursor: 'pointer',
              transition: 'all 150ms',
              boxShadow: selected ? '0 2px 12px rgba(74,127,248,0.12)' : 'none',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => {
              if (!selected) (e.currentTarget as HTMLElement).style.background = '#fff'
            }}
            onMouseLeave={e => {
              if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'
            }}
          >
            {/* Type tag */}
            <div style={{ marginBottom: '10px' }}>
              <span
                className={isQuantitative ? 'tag tag-blue' : 'tag tag-gray'}
                style={{ fontSize: '10px', padding: '3px 8px' }}
              >
                {isQuantitative ? 'Quantitative' : 'Qualitative'}
              </span>
            </div>

            {/* Label */}
            <div style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
              marginBottom: '6px',
              lineHeight: 1.2,
            }}>
              {type.label}
            </div>

            {/* Description */}
            <div style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              lineHeight: 1.5,
            }}>
              {type.description}
            </div>

            {/* Selection dot */}
            {selected && (
              <div style={{
                marginTop: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <div style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '9999px',
                  background: 'var(--primary)',
                }} />
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>Selected</span>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
