'use client'

import AppHeader from '@/components/AppHeader'
import { personas, accentMap } from '@/lib/personas'
import { Persona } from '@/lib/types'

export default function PersonasPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <AppHeader />

      <div className="container-xl pt-12 pb-24">

        {/* Page heading */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{
            fontSize: '28px', fontWeight: 800,
            letterSpacing: '-0.025em', color: 'var(--text-primary)',
            marginBottom: '6px',
          }}>
            Personas
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', maxWidth: '480px' }}>
            Each persona is a richly defined synthetic customer archetype. Select one or more when running a test to see how different audiences react to your idea.
          </p>
        </div>

        {/* Persona grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(480px, 1fr))',
          gap: '16px',
        }}>
          {personas.map(persona => (
            <PersonaCard key={persona.id} persona={persona} />
          ))}
        </div>

        {/* Add new persona */}
        <div style={{ marginTop: '32px' }}>
          <button
            type="button"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '999px',
              border: '1.5px dashed #ccc',
              background: 'transparent', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600,
              color: 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#1a1a1a'
              e.currentTarget.style.color = 'var(--text-primary)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#ccc'
              e.currentTarget.style.color = 'var(--text-secondary)'
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Add new persona
          </button>
        </div>

      </div>
    </div>
  )
}

function PersonaCard({ persona }: { persona: Persona }) {
  const accent = accentMap[persona.accentColor] ?? accentMap.indigo

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>

      {/* Card header */}
      <div style={{
        padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: '14px',
        borderBottom: '1px solid #f5f5f5',
      }}>
        {/* Avatar */}
        <div style={{
          width: '52px', height: '52px', borderRadius: '14px',
          background: accent.avatarBg, color: accent.avatarText,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '26px', flexShrink: 0,
        }}>
          {persona.emoji}
        </div>

        {/* Name + tagline + traits */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '2px' }}>
            {persona.name}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
            {persona.tagline}
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {persona.traits.map(trait => (
              <span key={trait} style={{
                padding: '2px 9px', borderRadius: '999px',
                background: accent.avatarBg, color: accent.avatarText,
                fontSize: '11px', fontWeight: 600,
              }}>
                {trait}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Demographics row */}
      <div style={{
        display: 'flex', gap: '0',
        borderBottom: '1px solid #f5f5f5',
      }}>
        {[
          { label: 'Age',      value: persona.demographics.age },
          { label: 'Income',   value: persona.demographics.income },
          { label: 'Location', value: persona.demographics.location },
        ].map((item, i) => (
          <div key={item.label} style={{
            flex: 1, padding: '12px 16px',
            borderLeft: i > 0 ? '1px solid #f5f5f5' : 'none',
          }}>
            <div style={{ fontSize: '9px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-disabled)', marginBottom: '3px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {item.value}
            </div>
          </div>
        ))}
      </div>

      {/* Decision drivers + pain points */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>

        <div style={{ padding: '16px 18px', borderRight: '1px solid #f5f5f5' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#10B981', marginBottom: '10px',
          }}>
            ✓ What drives decisions
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {persona.decisionDrivers.map(d => (
              <li key={d} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', gap: '6px' }}>
                <span style={{ color: '#10B981', flexShrink: 0, marginTop: '1px' }}>·</span>
                {d}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ padding: '16px 18px' }}>
          <div style={{
            fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.06em', color: '#EF4444', marginBottom: '10px',
          }}>
            ✕ Pain points
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {persona.painPoints.map(p => (
              <li key={p} style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.4, display: 'flex', gap: '6px' }}>
                <span style={{ color: '#EF4444', flexShrink: 0, marginTop: '1px' }}>·</span>
                {p}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Tone / voice */}
      <div style={{
        padding: '12px 18px',
        borderTop: '1px solid #f5f5f5',
        background: '#fafafa',
        borderRadius: '0 0 20px 20px',
      }}>
        <span style={{
          fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.06em', color: 'var(--text-disabled)',
          marginRight: '8px',
        }}>
          Voice
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          {persona.tone}
        </span>
      </div>

    </div>
  )
}
