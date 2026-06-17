'use client'

import { useAudiences } from '@/lib/personas'

interface Props {
  personaIds: string[]
  activeId: string
  onChange: (id: string) => void
}

export default function PersonaTabBar({ personaIds, activeId, onChange }: Props) {
  const { byId } = useAudiences()
  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      overflowX: 'auto',
      paddingBottom: '2px',
      marginBottom: '32px',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      {personaIds.map((id) => {
        const audience = byId(id)
        const isActive = id === activeId
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              marginBottom: '-1px',
              borderRadius: '10px 10px 0 0',
              border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
              borderBottom: isActive ? '1px solid #fff' : '1px solid transparent',
              background: isActive ? '#fff' : 'transparent',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={(e) => { if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)' }}
          >
            <span>{audience?.emoji ?? '•'}</span>
            <span>{audience?.name ?? id}</span>
          </button>
        )
      })}
    </div>
  )
}
