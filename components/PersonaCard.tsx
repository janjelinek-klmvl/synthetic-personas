'use client'

import { Persona } from '@/lib/types'

// Map persona accentColor to Niva palette tag classes + avatar bg
const accentMap: Record<string, { tag: string; avatarBg: string; avatarText: string }> = {
  amber:  { tag: 'tag-yellow',  avatarBg: '#FFF3D6', avatarText: '#8A6200' },
  violet: { tag: 'tag-purple',  avatarBg: '#E8DEFF', avatarText: '#6B3ECC' },
  cyan:   { tag: 'tag-blue',    avatarBg: '#D6E4FD', avatarText: '#2E63E0' },
  green:  { tag: 'tag-gray',    avatarBg: '#D4EDD4', avatarText: '#2A6A2A' },
  indigo: { tag: 'tag-indigo',  avatarBg: '#D9DCFF', avatarText: '#3D52C4' },
  rose:   { tag: 'tag-pink',    avatarBg: '#FFD6E0', avatarText: '#C4335A' },
}

interface Props {
  persona: Persona
  selected: boolean
  onSelect: (id: string) => void
}

export default function PersonaCard({ persona, selected, onSelect }: Props) {
  const accent = accentMap[persona.accentColor] ?? accentMap.indigo

  return (
    <button
      type="button"
      onClick={() => onSelect(persona.id)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
        padding: '18px 20px',
        marginBottom: '8px',
        background: selected ? '#fff' : 'transparent',
        border: selected ? '1.5px solid var(--primary)' : '1.5px solid transparent',
        borderRadius: '16px',
        cursor: 'pointer',
        transition: 'all 150ms',
        boxShadow: selected ? '0 2px 12px rgba(74,127,248,0.12)' : 'none',
      }}
      onMouseEnter={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = '#fff'
      }}
      onMouseLeave={e => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'
      }}
    >
      {/* Avatar tile */}
      <div
        className="avatar-tile flex-shrink-0"
        style={{ background: accent.avatarBg, color: accent.avatarText, fontSize: '22px', width: '48px', height: '48px', borderRadius: '12px' }}
      >
        {persona.emoji}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '15px',
          fontWeight: selected ? 700 : 600,
          color: 'var(--text-primary)',
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}>
          {persona.name}
        </div>
        <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.4 }}>
          {persona.tagline}
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
          Age {persona.demographics.age}
        </div>

        {selected && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '12px' }}>
            {persona.traits.map(trait => (
              <span key={trait} className={`tag ${accent.tag}`} style={{ fontSize: '11px', padding: '4px 10px' }}>
                {trait}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      <div style={{
        flexShrink: 0,
        width: '22px',
        height: '22px',
        borderRadius: '9999px',
        border: selected ? 'none' : '2px solid var(--border)',
        background: selected ? 'var(--primary)' : 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 150ms',
        marginTop: '2px',
      }}>
        {selected && (
          <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
            <path d="M1 4L4 7L10 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
    </button>
  )
}
