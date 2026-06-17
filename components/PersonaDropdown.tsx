'use client'

import { useEffect, useRef, useState } from 'react'
import { accentMap, useAudiences } from '@/lib/personas'

interface Props {
  value: string[]
  onChange: (ids: string[]) => void
}

// Renamed conceptually to "audience picker" but the file/component name is
// preserved so the existing import in app/page.tsx keeps working.
export default function PersonaDropdown({ value, onChange }: Props) {
  const { audiences, loading, error, refresh } = useAudiences()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = audiences.filter((a) => value.includes(a.id))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleToggle(id: string) {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id]
    onChange(next)
  }

  const hasSelection = value.length > 0

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '6px 12px', borderRadius: '20px',
          border: hasSelection ? '1.5px solid #1a1a1a' : '1.5px solid #d1d1d1',
          background: hasSelection ? '#1a1a1a' : '#fff',
          color: hasSelection ? '#fff' : '#666',
          fontSize: '13px', fontWeight: 500, cursor: 'pointer',
          whiteSpace: 'nowrap', transition: 'all 0.15s',
        }}
      >
        {selected.length === 0 ? (
          'Audiences'
        ) : selected.length === 1 ? (
          <><span>{selected[0].emoji}</span><span>{selected[0].name}</span></>
        ) : (
          <>
            <span>{selected[0].emoji}</span>
            <span>{selected[0].name}</span>
            <span style={{
              background: 'rgba(255,255,255,0.2)', borderRadius: '10px',
              padding: '1px 7px', fontSize: '11px', fontWeight: 700,
            }}>+{selected.length - 1}</span>
          </>
        )}
        <svg
          width="12" height="12" viewBox="0 0 12 12" fill="none"
          style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            background: '#fff', border: '1px solid #e5e5e5', borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            width: '480px', zIndex: 100, padding: '8px',
          }}
        >
          {loading && (
            <div style={{ padding: '20px', fontSize: '13px', color: '#999', textAlign: 'center' }}>
              Loading audiences from Audience Studio…
            </div>
          )}

          {error && (
            <div style={{ padding: '16px', fontSize: '13px', color: '#c4335a' }}>
              Could not load audiences: {error}.{' '}
              <button
                type="button"
                onClick={() => { void refresh() }}
                style={{ background: 'none', border: 'none', color: '#1a1a1a', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              >Retry</button>
            </div>
          )}

          {!loading && !error && audiences.length === 0 && (
            <div style={{ padding: '20px', fontSize: '13px', color: '#999', textAlign: 'center' }}>
              No audiences available. Configure access in Audience Studio.
            </div>
          )}

          {!loading && audiences.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {audiences.map((audience) => {
                const accent = accentMap[audience.accentColor] ?? accentMap.indigo
                const isSelected = value.includes(audience.id)
                return (
                  <button
                    key={audience.id}
                    type="button"
                    onClick={() => handleToggle(audience.id)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: '8px', padding: '12px 10px', borderRadius: '10px',
                      border: isSelected ? '1.5px solid #1a1a1a' : '1.5px solid transparent',
                      background: isSelected ? '#f5f5f5' : 'transparent',
                      cursor: 'pointer', textAlign: 'center', transition: 'all 0.1s',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = '#f9f9f9' }}
                    onMouseLeave={(e) => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '16px', height: '16px', borderRadius: '50%',
                        background: accent.avatarText,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '9px', color: '#fff', fontWeight: 700,
                      }}>✓</div>
                    )}
                    <div
                      style={{
                        width: '40px', height: '40px', borderRadius: '12px',
                        background: accent.avatarBg, color: accent.avatarText,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '20px', flexShrink: 0,
                      }}
                    >{audience.emoji}</div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>
                        {audience.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#999', marginTop: '2px' }}>
                        {audience.personaCount} {audience.personaCount === 1 ? 'persona' : 'personas'}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          <div style={{ padding: '8px 4px 4px', borderTop: '1px solid #f0f0f0', marginTop: '6px' }}>
            <button
              type="button"
              onClick={() => setOpen(false)}
              style={{
                width: '100%', padding: '9px', borderRadius: '10px', border: 'none',
                background: value.length > 0 ? '#1a1a1a' : '#f0f0f0',
                color: value.length > 0 ? '#fff' : '#999',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {value.length === 0 ? 'Select audiences' : `Done · ${value.length} selected`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
