'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import ReportDrawer from '@/components/ReportDrawer'
import { loadHistory, deleteEntry, formatRelativeTime, ideaTypeLabel, getDisplayScoreMulti, HistoryEntry } from '@/lib/history'
import { getPersonaById, accentMap } from '@/lib/personas'
import { IdeaType } from '@/lib/types'

export default function HistoryPage() {
  const [entries,       setEntries]       = useState<HistoryEntry[]>([])
  const [filterPersona, setFilterPersona] = useState('all')
  const [filterType,    setFilterType]    = useState<IdeaType | 'all'>('all')
  const [selected,      setSelected]      = useState<HistoryEntry | null>(null)

  useEffect(() => { setEntries(loadHistory()) }, [])

  function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    deleteEntry(id)
    setEntries(prev => prev.filter(en => en.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const usedPersonaIds = Array.from(new Set(entries.flatMap(e => e.personaIds)))

  const filtered = entries.filter(e => {
    if (filterType !== 'all' && e.ideaType !== filterType) return false
    if (filterPersona !== 'all' && !e.personaIds.includes(filterPersona)) return false
    return true
  })

  return (
    <div className="min-h-screen" style={{ background: 'var(--surface)' }}>
      <AppHeader />

      <div className="container-xl pt-12 pb-24">

        {/* Page heading */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{
            fontSize: '28px', fontWeight: 800,
            letterSpacing: '-0.025em', color: 'var(--text-primary)',
            marginBottom: '4px',
          }}>
            Test History
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
            {entries.length} {entries.length === 1 ? 'run' : 'runs'} saved locally
          </p>
        </div>

        {entries.length === 0 ? (

          /* ── Empty state ─────────────────────────────────── */
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            background: '#fff', borderRadius: '24px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: '52px', marginBottom: '16px' }}>🧪</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
              No tests yet
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-tertiary)', marginBottom: '28px' }}>
              Run your first idea test and it&apos;ll show up here automatically.
            </p>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'var(--primary)', color: '#fff',
              padding: '10px 22px', borderRadius: '999px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}>
              Run your first test →
            </Link>
          </div>

        ) : (
          <>
            {/* ── Filters ──────────────────────────────────── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>

              {/* Idea type pills */}
              <div style={{ display: 'flex', gap: '6px' }}>
                {([
                  { id: 'all',         label: 'All' },
                  { id: 'proposition', label: 'Proposition' },
                  { id: 'campaign',    label: 'Campaign' },
                ] as { id: IdeaType | 'all'; label: string }[]).map(f => (
                  <button
                    key={f.id}
                    onClick={() => setFilterType(f.id)}
                    style={{
                      padding: '6px 14px', borderRadius: '999px', border: 'none',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      background: filterType === f.id ? 'var(--primary)' : '#fff',
                      color:      filterType === f.id ? '#fff' : 'var(--text-secondary)',
                      boxShadow:  filterType === f.id ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                      transition: 'all 0.15s',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Persona pills (only when >1 persona used) */}
              {usedPersonaIds.length > 1 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => setFilterPersona('all')}
                    style={{
                      padding: '5px 12px', borderRadius: '999px', border: 'none',
                      fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      background: filterPersona === 'all' ? 'var(--text-primary)' : '#fff',
                      color:      filterPersona === 'all' ? '#fff' : 'var(--text-secondary)',
                      boxShadow:  filterPersona === 'all' ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                      transition: 'all 0.15s',
                    }}
                  >
                    All personas
                  </button>
                  {usedPersonaIds.map(pid => {
                    const p = getPersonaById(pid)
                    if (!p) return null
                    const active = filterPersona === pid
                    return (
                      <button
                        key={pid}
                        onClick={() => setFilterPersona(pid)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '5px',
                          padding: '5px 12px', borderRadius: '999px', border: 'none',
                          fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                          background: active ? 'var(--text-primary)' : '#fff',
                          color:      active ? '#fff' : 'var(--text-secondary)',
                          boxShadow:  active ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                          transition: 'all 0.15s',
                        }}
                      >
                        {p.emoji} {p.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── Card list ────────────────────────────────── */}
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '48px',
                color: 'var(--text-tertiary)', fontSize: '14px',
              }}>
                No results match this filter.
              </div>
            ) : (
              <div className="history-grid">
                {filtered.map(entry => (
                  <HistoryCard
                    key={entry.id}
                    entry={entry}
                    onClick={() => setSelected(entry)}
                    onDelete={e => handleDelete(entry.id, e)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ReportDrawer entry={selected} onClose={() => setSelected(null)} />
    </div>
  )
}

/* ── History card ───────────────────────────────────────────── */
function HistoryCard({
  entry,
  onClick,
  onDelete,
}: {
  entry:    HistoryEntry
  onClick:  () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const [hovered, setHovered] = useState(false)

  const isMulti = entry.personaIds.length > 1
  const firstPersona = getPersonaById(entry.personaIds[0])

  const { value: score, max } = getDisplayScoreMulti(entry.reports)
  const scoreStr = score != null ? (max === 10 ? `${score}/10` : `${score}%`) : '—'
  const scoreColor =
    score == null ? 'var(--text-disabled)' :
    max === 10
      ? score >= 7 ? '#10B981' : score >= 5 ? '#F59E0B' : '#EF4444'
      : score >= 70 ? '#10B981' : score >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        borderRadius: '16px',
        padding: '16px 20px',
        boxShadow: hovered ? '0 4px 16px rgba(0,0,0,0.10)' : '0 1px 4px rgba(0,0,0,0.06)',
        transform: hovered ? 'translateY(-1px)' : 'translateY(0)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: '14px',
        transition: 'box-shadow 0.15s, transform 0.15s',
        position: 'relative',
      }}
    >
      {/* Avatar — single or stacked */}
      {isMulti ? (
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {entry.personaIds.slice(0, 4).map((pid, i) => {
            const p = getPersonaById(pid)
            const accent = accentMap[p?.accentColor ?? 'indigo'] ?? accentMap.indigo
            return (
              <div key={pid} style={{
                width: '34px', height: '34px', borderRadius: '10px',
                background: accent.avatarBg, color: accent.avatarText,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '16px', border: '2px solid #fff',
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
          width: '42px', height: '42px', borderRadius: '12px',
          background: 'var(--primary-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', flexShrink: 0,
        }}>
          {firstPersona.emoji}
        </div>
      ) : null}

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {isMulti
              ? `${entry.personaIds.length} personas`
              : (firstPersona?.name ?? entry.personaIds[0])
            }
          </span>
          <span style={{
            fontSize: '9px', fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '2px 7px', borderRadius: '999px',
            background: '#f0f0f0', color: '#666',
          }}>
            {ideaTypeLabel(entry.ideaType)}
          </span>
        </div>
        <p style={{
          fontSize: '12px', color: 'var(--text-tertiary)', margin: 0,
          lineHeight: 1.4,
          overflow: 'hidden', display: '-webkit-box',
          WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        }}>
          {entry.ideaText}
        </p>
        <div style={{ fontSize: '11px', color: 'var(--text-disabled)', marginTop: '5px' }}>
          {formatRelativeTime(entry.createdAt)}
        </div>
      </div>

      {/* Score */}
      <div style={{ textAlign: 'right', flexShrink: 0, paddingRight: '8px' }}>
        <div style={{
          fontSize: '22px', fontWeight: 800,
          letterSpacing: '-0.03em', color: scoreColor, lineHeight: 1,
        }}>
          {scoreStr}
        </div>
        {isMulti && score != null && (
          <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginTop: '2px' }}>
            avg
          </div>
        )}
      </div>

      {/* Delete — appears on hover */}
      <button
        onClick={onDelete}
        style={{
          position: 'absolute', top: '10px', right: '10px',
          width: '24px', height: '24px', borderRadius: '999px',
          border: 'none', background: 'var(--border)',
          color: 'var(--text-tertiary)', fontSize: '10px',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s, background 0.15s, color 0.15s',
          lineHeight: 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = '#FEE2E2'
          e.currentTarget.style.color = '#EF4444'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'var(--border)'
          e.currentTarget.style.color = 'var(--text-tertiary)'
        }}
      >
        ✕
      </button>
    </div>
  )
}
