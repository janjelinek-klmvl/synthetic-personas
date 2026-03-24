'use client'

import { TestContext } from '@/lib/types'
import { personas, accentMap } from '@/lib/personas'
import { ideaTypeLabel } from '@/lib/history'

interface Props {
  ideaText: string
  personaIds: string[]
  context: TestContext
  onEdit: () => void
}

export default function SetupSummary({ ideaText, personaIds, context, onEdit }: Props) {
  const selectedPersonas = personaIds.map(id => personas.find(p => p.id === id)).filter(Boolean) as typeof personas

  // Show first 2 filled brief values as context tags
  const contextTags: string[] = Object.values(context.brief ?? {})
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .slice(0, 2)
    .map(v => v.length > 28 ? v.slice(0, 28) + '…' : v)

  return (
    <div style={{ background: '#fff', borderBottom: '1px solid #f0f0f0' }}>
    <div
      className="container-xl"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        paddingTop: '14px',
        paddingBottom: '14px',
        flexWrap: 'wrap',
      }}
    >
      {/* Single persona */}
      {selectedPersonas.length === 1 && (() => {
        const persona = selectedPersonas[0]
        const accent = accentMap[persona.accentColor] ?? accentMap.indigo
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '8px',
              background: accent.avatarBg, color: accent.avatarText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}>
              {persona.emoji}
            </div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>
              {persona.name}
            </span>
          </div>
        )
      })()}

      {/* Multi persona — overlapping stack */}
      {selectedPersonas.length > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <div style={{ display: 'flex' }}>
            {selectedPersonas.slice(0, 4).map((persona, i) => {
              const accent = accentMap[persona.accentColor] ?? accentMap.indigo
              return (
                <div key={persona.id} style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: accent.avatarBg, color: accent.avatarText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', border: '2px solid #fff',
                  marginLeft: i === 0 ? 0 : '-6px',
                  zIndex: selectedPersonas.length - i,
                  position: 'relative',
                }}>
                  {persona.emoji}
                </div>
              )
            })}
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1a1a1a' }}>
            {selectedPersonas.length} personas
          </span>
        </div>
      )}

      {/* Divider */}
      <div style={{ width: '1px', height: '20px', background: '#e5e5e5', flexShrink: 0 }} />

      {/* Idea type badge */}
      <span style={{
        padding: '3px 10px', borderRadius: '12px',
        background: '#f0f0f0', fontSize: '12px', fontWeight: 500, color: '#666',
        flexShrink: 0,
      }}>
        {ideaTypeLabel(context.ideaType)}
      </span>

      {/* Idea text snippet */}
      <span style={{
        fontSize: '13px', color: '#555', flex: 1,
        overflow: 'hidden', textOverflow: 'ellipsis',
        whiteSpace: 'nowrap', minWidth: 0,
      }}>
        {ideaText.length > 120 ? ideaText.slice(0, 120) + '…' : ideaText}
      </span>

      {/* Context tags */}
      {contextTags.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          {contextTags.map((tag, i) => (
            <span key={i} style={{
              padding: '3px 10px', borderRadius: '12px',
              background: '#f5f5f5', fontSize: '12px', color: '#888',
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Edit button */}
      <button
        type="button"
        onClick={onEdit}
        style={{
          flexShrink: 0, padding: '6px 14px', borderRadius: '20px',
          border: '1.5px solid #e5e5e5', background: '#fff',
          color: '#555', fontSize: '12px', fontWeight: 500,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#1a1a1a'; (e.currentTarget as HTMLElement).style.color = '#1a1a1a' }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#e5e5e5'; (e.currentTarget as HTMLElement).style.color = '#555' }}
      >
        Edit
      </button>
    </div>
    </div>
  )
}
