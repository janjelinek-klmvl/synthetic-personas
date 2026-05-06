'use client'

import { useEffect, useState } from 'react'
import { personas, accentMap } from '@/lib/personas'

const ACCENT_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  amber:  { bg: '#FFF3D6', text: '#8A6200', ring: '#F5C842' },
  violet: { bg: '#E8DEFF', text: '#6B3ECC', ring: '#9B72EF' },
  cyan:   { bg: '#D6E4FD', text: '#2E63E0', ring: '#60A5FA' },
  green:  { bg: '#D4EDD4', text: '#2A6A2A', ring: '#6DBF6D' },
  indigo: { bg: '#D9DCFF', text: '#3D52C4', ring: '#7B8EE8' },
  rose:   { bg: '#FFD6E0', text: '#C4335A', ring: '#F472A8' },
}

function getInitials(name: string): string {
  return name
    .split(/[\s-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

function buildMessages(count: number): string[] {
  return [
    'Assembling your panel…',
    `Briefing ${count} ${count === 1 ? 'persona' : 'personas'}…`,
    'Running qualitative analysis…',
    'Crunching the numbers…',
    'Synthesising reactions…',
    'Compiling insights…',
  ]
}

interface Props {
  personaIds: string[]
}

export default function TestLoadingState({ personaIds }: Props) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)
  const messages = buildMessages(personaIds.length)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % messages.length)
        setVisible(true)
      }, 200)
    }, 1800)
    return () => clearInterval(interval)
  }, [messages.length])

  const panelPersonas = personaIds.map(id => {
    const p = personas.find(x => x.id === id)
    return {
      id,
      initials: p ? getInitials(p.name) : id.slice(0, 2).toUpperCase(),
      colors: p ? (ACCENT_COLORS[p.accentColor] ?? ACCENT_COLORS.indigo) : ACCENT_COLORS.indigo,
    }
  })

  return (
    <div style={{ marginBottom: '32px' }}>
      <style>{`
        @keyframes panelPulse {
          0%, 100% { transform: scale(1);    box-shadow: 0 0 0 0 rgba(0,0,0,0); }
          50%       { transform: scale(1.08); box-shadow: 0 0 0 5px var(--ring-color); }
        }
        @keyframes testFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0);   opacity: 0.3; }
          40%           { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes connectorPulse {
          0%, 100% { opacity: 0.2; }
          50%       { opacity: 0.5; }
        }
      `}</style>

      {/* Panel row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0', marginBottom: '20px', position: 'relative' }}>
        {panelPersonas.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center' }}>
            {/* Connector line between avatars */}
            {i > 0 && (
              <div style={{
                width: '24px', height: '2px',
                background: 'linear-gradient(90deg, #e0e0e0, #d0d0d0)',
                animation: 'connectorPulse 1.8s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            )}
            {/* Avatar circle */}
            <div
              style={{
                width: '44px', height: '44px', borderRadius: '50%',
                background: p.colors.bg,
                color: p.colors.text,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: 600, letterSpacing: '0.02em',
                border: `2px solid ${p.colors.ring}`,
                // @ts-expect-error CSS custom property
                '--ring-color': p.colors.ring + '40',
                animation: `panelPulse 2s ease-in-out infinite`,
                animationDelay: `${i * 0.3}s`,
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              {p.initials}
            </div>
          </div>
        ))}

        {/* "Thinking" dots floating above last avatar — just visual flair */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '12px', marginBottom: '2px' }}>
          {[0, 1, 2].map(d => (
            <div
              key={d}
              style={{
                width: '5px', height: '5px', borderRadius: '50%',
                background: '#bbb',
                animation: 'dotBounce 1.2s ease-in-out infinite',
                animationDelay: `${d * 0.2}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Analysis tags */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        {['Qualitative', 'Quantitative'].map((label, i) => (
          <div
            key={label}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '12px', color: '#999', fontWeight: 500,
              background: '#f7f7f7', borderRadius: '20px',
              padding: '4px 10px',
            }}
          >
            {label}
            <div style={{ display: 'flex', gap: '3px' }}>
              {[0, 1, 2].map(d => (
                <div
                  key={d}
                  style={{
                    width: '4px', height: '4px', borderRadius: '50%',
                    background: '#ccc',
                    animation: 'dotBounce 1.4s ease-in-out infinite',
                    animationDelay: `${i * 0.4 + d * 0.18}s`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cycling message */}
      <div style={{ minHeight: '22px' }}>
        <span
          key={msgIndex}
          style={{
            fontSize: '14px',
            color: 'var(--text-secondary)',
            animation: visible ? 'testFade 0.25s ease-out forwards' : 'none',
            opacity: visible ? undefined : 0,
          }}
        >
          {messages[msgIndex]}
        </span>
      </div>
    </div>
  )
}
