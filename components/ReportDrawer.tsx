'use client'

import { useEffect, useState } from 'react'
import { HistoryEntry, formatRelativeTime, ideaTypeLabel } from '@/lib/history'
import { getPersonaById, accentMap } from '@/lib/personas'
import ReportSection from './ReportSection'

interface Props {
  entry:   HistoryEntry | null
  onClose: () => void
}

export default function ReportDrawer({ entry, onClose }: Props) {
  const [activePersonaId, setActivePersonaId] = useState<string | null>(null)

  // Reset active tab when entry changes
  useEffect(() => {
    setActivePersonaId(entry?.personaIds[0] ?? null)
  }, [entry?.id])

  // Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = entry ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [entry])

  if (!entry) return null

  const isMulti = entry.personaIds.length > 1
  const firstPersona = getPersonaById(entry.personaIds[0])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(20,18,14,0.4)',
          backdropFilter: 'blur(3px)',
          zIndex: 40,
          animation: 'drawerFadeIn 0.2s ease',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'min(760px, 100vw)',
        background: 'var(--surface)',
        zIndex: 50,
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 48px rgba(0,0,0,0.14)',
        animation: 'drawerSlideIn 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
      }}>

        {/* Drawer header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex', alignItems: 'flex-start', gap: '12px',
          flexShrink: 0,
          background: 'var(--surface)',
        }}>
          {/* Avatar — single or stacked */}
          {isMulti ? (
            <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center' }}>
              {entry.personaIds.slice(0, 4).map((pid, i) => {
                const p = getPersonaById(pid)
                const accent = accentMap[p?.accentColor ?? 'indigo'] ?? accentMap.indigo
                return (
                  <div key={pid} style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: accent.avatarBg, color: accent.avatarText,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '18px', border: '2px solid var(--surface)',
                    marginLeft: i === 0 ? 0 : '-8px',
                    position: 'relative', zIndex: entry.personaIds.length - i,
                  }}>
                    {p?.emoji ?? '?'}
                  </div>
                )
              })}
            </div>
          ) : firstPersona ? (
            <div style={{
              width: '44px', height: '44px', borderRadius: '12px',
              background: 'var(--primary-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '22px', flexShrink: 0,
            }}>
              {firstPersona.emoji}
            </div>
          ) : null}

          {/* Meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {isMulti
                  ? `${entry.personaIds.length} personas`
                  : (firstPersona?.name ?? entry.personaIds[0])
                }
              </span>
              <span style={{
                fontSize: '9px', fontWeight: 700, letterSpacing: '0.07em',
                textTransform: 'uppercase', padding: '2px 8px', borderRadius: '999px',
                background: '#f0f0f0', color: '#666',
              }}>
                {ideaTypeLabel(entry.ideaType)}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-disabled)', marginLeft: 'auto' }}>
                {formatRelativeTime(entry.createdAt)}
              </span>
            </div>
            <p style={{
              fontSize: '12px', color: 'var(--text-tertiary)', margin: 0,
              lineHeight: 1.45,
              overflow: 'hidden', display: '-webkit-box',
              WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
            }}>
              {entry.ideaText}
            </p>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            style={{
              width: '32px', height: '32px', borderRadius: '999px',
              border: 'none', background: 'var(--border)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-secondary)', fontSize: '14px', flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--border-subtle)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--border)')}
          >
            ✕
          </button>
        </div>

        {/* Scrollable report */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <ReportSection
            reports={entry.reports}
            loading={false}
            error={null}
            disableScroll
            activePersonaId={activePersonaId}
            onTabChange={setActivePersonaId}
            ideaText={entry.ideaText}
            context={entry.context}
          />
        </div>
      </div>

      <style>{`
        @keyframes drawerFadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes drawerSlideIn { from { transform: translateX(100%) } to { transform: translateX(0) } }
      `}</style>
    </>
  )
}
