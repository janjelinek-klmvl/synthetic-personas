'use client'

import { useState, useRef, useEffect } from 'react'
import { IdeaType } from '@/lib/types'

const IDEA_TYPES: { id: IdeaType; label: string; description: string }[] = [
  { id: 'proposition', label: 'Product proposition', description: 'A new product or service concept' },
  { id: 'campaign',    label: 'Marketing message',   description: 'A campaign, tagline, or ad concept' },
]

interface Props {
  value: IdeaType | null
  onChange: (value: IdeaType) => void
}

export default function IdeaTypeDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selected = IDEA_TYPES.find(t => t.id === value)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          border: value ? '1.5px solid #1a1a1a' : '1.5px solid #d1d1d1',
          background: value ? '#1a1a1a' : '#fff',
          color: value ? '#fff' : '#666',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        {selected ? selected.label : 'Type of idea'}
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            minWidth: '220px',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          {IDEA_TYPES.map(type => (
            <button
              key={type.id}
              type="button"
              onClick={() => { onChange(type.id); setOpen(false) }}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: value === type.id ? '#f5f5f5' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '13px',
                color: '#1a1a1a',
                fontWeight: value === type.id ? 600 : 400,
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (value !== type.id) (e.target as HTMLElement).style.background = '#fafafa' }}
              onMouseLeave={e => { if (value !== type.id) (e.target as HTMLElement).style.background = 'transparent' }}
            >
              {type.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
