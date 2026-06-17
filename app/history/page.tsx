'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import ReportDrawer from '@/components/ReportDrawer'
import {
  loadHistory,
  deleteEntry,
  formatRelativeTime,
  ideaTypeLabel,
  HistoryEntry,
} from '@/lib/history'
import { useAudiences, accentMap } from '@/lib/personas'
import { IdeaType } from '@/lib/types'
import { SX, FONT, PAGE_W, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { BtnPrimary } from '@/components/design/Btn'
import { computeVerdict } from '@/lib/aggregate-display'
import { bandColor, bandLabel } from '@/lib/reception-colors'

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [filterAudience, setFilterAudience] = useState('all')
  const [filterType, setFilterType] = useState<IdeaType | 'all'>('all')
  const [selected, setSelected] = useState<HistoryEntry | null>(null)

  useEffect(() => {
    void loadHistory().then(setEntries)
  }, [])

  async function handleDelete(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    await deleteEntry(id)
    setEntries((prev) => prev.filter((en) => en.run_id !== id))
    if (selected?.run_id === id) setSelected(null)
  }

  const usedAudienceIds = Array.from(new Set(entries.flatMap((e) => e.audience_ids)))

  const filtered = entries.filter((e) => {
    if (filterType !== 'all' && e.proposition_snapshot.idea_type !== filterType) return false
    if (filterAudience !== 'all' && !e.audience_ids.includes(filterAudience)) return false
    return true
  })

  return (
    <div className="min-h-screen" style={{ background: SX.paper }}>
      <AppHeader />

      <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '56px 48px 96px' }}>
        <div style={{ borderTop: `2px solid ${SX.accent}`, paddingTop: 14, marginBottom: 32 }}>
          <Cap color={SX.accent} size={11}>
            History
          </Cap>
          <h1
            style={{
              margin: '12px 0 12px',
              fontFamily: FONT.grotesque,
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: SX.ink,
              lineHeight: 1,
            }}
          >
            Every run, kept.
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: FONT.grotesque,
              fontSize: 14,
              color: SX.soft,
            }}
          >
            {entries.length} {entries.length === 1 ? 'run' : 'runs'} total.
          </p>
        </div>

        {entries.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '80px 24px',
              border: `1px solid ${SX.hair}`,
              background: SX.paper,
            }}
          >
            <Cap color={SX.faint} size={11}>
              Nothing yet
            </Cap>
            <h2
              style={{
                fontFamily: FONT.grotesque,
                fontSize: 22,
                fontWeight: 800,
                color: SX.ink,
                margin: '12px 0 8px',
                letterSpacing: '-0.02em',
              }}
            >
              No tests yet.
            </h2>
            <p
              style={{
                fontFamily: FONT.grotesque,
                fontSize: 13.5,
                color: SX.soft,
                marginBottom: 24,
              }}
            >
              Run your first idea test and it&apos;ll show up here automatically.
            </p>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <BtnPrimary>Run your first test →</BtnPrimary>
            </Link>
          </div>
        ) : (
          <>
            {/* Filters */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(
                  [
                    { id: 'all', label: 'All' },
                    { id: 'insight', label: 'Insight' },
                    { id: 'proposition', label: 'Proposition' },
                    { id: 'campaign', label: 'Campaign' },
                  ] as { id: IdeaType | 'all'; label: string }[]
                ).map((f) => (
                  <FilterChip
                    key={f.id}
                    label={f.label}
                    active={filterType === f.id}
                    onClick={() => setFilterType(f.id)}
                  />
                ))}
              </div>

              {usedAudienceIds.length > 1 && (
                <AudienceFilters
                  usedAudienceIds={usedAudienceIds}
                  filterAudience={filterAudience}
                  setFilterAudience={setFilterAudience}
                />
              )}
            </div>

            {filtered.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: 48,
                  fontFamily: FONT.grotesque,
                  color: SX.soft,
                  fontSize: 14,
                }}
              >
                No results match this filter.
              </div>
            ) : (
              <div style={{ border: `1px solid ${SX.hair}` }}>
                {filtered.map((entry, i) => (
                  <HistoryRow
                    key={entry.run_id}
                    entry={entry}
                    last={i === filtered.length - 1}
                    onClick={() => setSelected(entry)}
                    onDelete={(e) => {
                      void handleDelete(entry.run_id, e)
                    }}
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

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '6px 14px',
        border: `1px solid ${active ? SX.ink : SX.hair}`,
        background: active ? SX.ink : 'transparent',
        color: active ? SX.paper : SX.ink,
        fontFamily: FONT.grotesque,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        cursor: 'pointer',
        transition: 'background 120ms, color 120ms, border-color 120ms',
      }}
    >
      {label}
    </button>
  )
}

function AudienceFilters({
  usedAudienceIds,
  filterAudience,
  setFilterAudience,
}: {
  usedAudienceIds: string[]
  filterAudience: string
  setFilterAudience: (id: string) => void
}) {
  const { byId } = useAudiences()
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <FilterChip
        label="All audiences"
        active={filterAudience === 'all'}
        onClick={() => setFilterAudience('all')}
      />
      {usedAudienceIds.map((aid) => {
        const a = byId(aid)
        const active = filterAudience === aid
        return (
          <button
            key={aid}
            type="button"
            onClick={() => setFilterAudience(aid)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              border: `1px solid ${active ? SX.ink : SX.hair}`,
              background: active ? SX.ink : 'transparent',
              color: active ? SX.paper : SX.ink,
              fontFamily: FONT.grotesque,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 120ms, color 120ms, border-color 120ms',
            }}
          >
            <span aria-hidden style={{ fontSize: 13 }}>
              {a?.emoji ?? '•'}
            </span>
            <span>{a?.name ?? aid}</span>
          </button>
        )
      })}
    </div>
  )
}

function HistoryRow({
  entry,
  last,
  onClick,
  onDelete,
}: {
  entry: HistoryEntry
  last: boolean
  onClick: () => void
  onDelete: (e: React.MouseEvent) => void
}) {
  const { byId, quantMetrics } = useAudiences()
  const [hovered, setHovered] = useState(false)

  const isMulti = entry.audience_ids.length > 1
  const first = byId(entry.audience_ids[0])
  const idea = entry.proposition_snapshot?.idea ?? ''

  // Pick the first succeeded audience for the score
  const verdict = (() => {
    for (const aid of entry.audience_ids) {
      const state = entry.per_audience[aid]
      if (state?.status === 'succeeded' && state.result) {
        return computeVerdict(state.result, (id) => quantMetrics.find((m) => m.id === id)?.name ?? id)
      }
    }
    return null
  })()

  const bandHex = verdict ? bandColor(verdict.band) : SX.faint
  const score = verdict?.score

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto auto',
        alignItems: 'center',
        gap: 18,
        padding: '18px 20px',
        background: hovered ? SX.tint : SX.paper,
        borderBottom: last ? 'none' : `1px solid ${SX.hair}`,
        cursor: 'pointer',
        transition: 'background 120ms',
        position: 'relative',
      }}
    >
      {/* Audience avatar(s) */}
      {isMulti ? (
        <div style={{ display: 'flex' }}>
          {entry.audience_ids.slice(0, 3).map((aid, i) => {
            const a = byId(aid)
            const accent = accentMap[a?.accentColor ?? 'indigo'] ?? accentMap.indigo
            return (
              <div
                key={aid}
                style={{
                  width: 32,
                  height: 32,
                  background: accent.avatarBg,
                  color: accent.avatarText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 16,
                  border: `2px solid ${SX.paper}`,
                  marginLeft: i === 0 ? 0 : -8,
                  position: 'relative',
                  zIndex: 10 - i,
                }}
                aria-hidden
              >
                {a?.emoji ?? '?'}
              </div>
            )
          })}
        </div>
      ) : first ? (
        <div
          style={{
            width: 36,
            height: 36,
            background: SX.tint,
            color: SX.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            flexShrink: 0,
          }}
          aria-hidden
        >
          {first.emoji}
        </div>
      ) : (
        <div style={{ width: 36 }} />
      )}

      {/* Body */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <span
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 13.5,
              fontWeight: 700,
              color: SX.ink,
              letterSpacing: '-0.005em',
            }}
          >
            {isMulti ? `${entry.audience_ids.length} audiences` : first?.name ?? entry.audience_ids[0]}
          </span>
          <Cap color={SX.faint} size={9}>
            {ideaTypeLabel(entry.proposition_snapshot.idea_type)}
          </Cap>
        </div>
        <p
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 12.5,
            color: SX.soft,
            margin: 0,
            lineHeight: 1.45,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {idea}
        </p>
        <div
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 10.5,
            color: SX.faint,
            marginTop: 5,
            letterSpacing: '0.02em',
            ...TNUM,
          }}
        >
          {formatRelativeTime(entry.created_at)}
        </div>
      </div>

      {/* Score + band */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        {score != null ? (
          <>
            <div
              style={{
                fontFamily: FONT.grotesque,
                fontSize: 28,
                fontWeight: 800,
                color: SX.ink,
                lineHeight: 1,
                letterSpacing: '-0.025em',
                ...TNUM,
              }}
            >
              {score}
              <span style={{ fontSize: 12, color: SX.faint, fontWeight: 500, marginLeft: 2 }}>/100</span>
            </div>
            <Cap color={bandHex} size={9.5} style={{ marginTop: 6 }}>
              {bandLabel(verdict!.band)}
            </Cap>
          </>
        ) : (
          <Cap color={SX.faint} size={10}>
            {entry.overall_status}
          </Cap>
        )}
      </div>

      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete run"
        style={{
          width: 24,
          height: 24,
          background: 'transparent',
          color: hovered ? SX.accent : SX.faint,
          border: `1px solid ${hovered ? SX.accent : SX.hair}`,
          fontSize: 11,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: hovered ? 1 : 0.4,
          transition: 'opacity 120ms, color 120ms, border-color 120ms',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
