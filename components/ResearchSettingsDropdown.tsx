'use client'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useAudiences } from '@/lib/personas'
import { estimateCredits } from '@/lib/estimate'
import type { IdeaType } from '@/lib/stimulus'

interface Props {
  quantIds: string[] | null      // null = "all" (no narrowing)
  qualIds: string[] | null
  respondentCount: number
  ideaCharLength: number
  ideaType: IdeaType | null      // filters metrics/modules by applicable_stimulus_types
  onQuantChange: (ids: string[] | null) => void
  onQualChange: (ids: string[] | null) => void
  onRespondentCountChange: (n: number) => void
}

const RESPONDENT_MIN = 1
const RESPONDENT_MAX = 96

export default function ResearchSettingsDropdown({
  quantIds,
  qualIds,
  respondentCount,
  ideaCharLength,
  ideaType,
  onQuantChange,
  onQualChange,
  onRespondentCountChange,
}: Props) {
  const { quantMetrics: allQuantMetrics, qualModules: allQualModules, pricing, balance, loading } = useAudiences()

  // Filter the library by the current stimulus type. Rows without the field
  // (legacy) fall back to "applies to all".
  const quantMetrics = useMemo(() => {
    if (!ideaType) return allQuantMetrics
    return allQuantMetrics.filter((m) => {
      const types = m.applicable_stimulus_types
      return !types || types.length === 0 || types.includes(ideaType)
    })
  }, [allQuantMetrics, ideaType])
  const qualModules = useMemo(() => {
    if (!ideaType) return allQualModules
    return allQualModules.filter((m) => {
      const types = m.applicable_stimulus_types
      return !types || types.length === 0 || types.includes(ideaType)
    })
  }, [allQualModules, ideaType])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)

  // Position the panel using fixed coords so it can never overflow the viewport.
  // When the trigger sits near the bottom of the screen, opening downward
  // leaves too little room for the metrics list (the fixed-height footer
  // crowds it out). Flip to upward-open in that case.
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({})
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const MARGIN = 8
    const MIN_PANEL = 360 // need at least this much room to render the full panel
    const spaceBelow = window.innerHeight - rect.bottom - MARGIN
    const spaceAbove = rect.top - MARGIN
    const right = window.innerWidth - rect.right

    if (spaceBelow >= MIN_PANEL || spaceBelow >= spaceAbove) {
      // Open downward (preferred).
      setPanelStyle({ top: rect.bottom + MARGIN, right, maxHeight: spaceBelow })
    } else {
      // Open upward — bottom-anchor so growth pushes the top up.
      setPanelStyle({ bottom: window.innerHeight - rect.top + MARGIN, right, maxHeight: spaceAbove })
    }
  }, [open])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const allQuantIds = useMemo(() => quantMetrics.map((m) => m.id), [quantMetrics])
  const allQualIds = useMemo(() => qualModules.map((m) => m.id), [qualModules])

  const effectiveQuant = quantIds ?? allQuantIds
  const effectiveQual = qualIds ?? allQualIds

  const estimate = useMemo(() => {
    if (!pricing) return null
    return estimateCredits(pricing.formula, {
      quant_metric_count: effectiveQuant.length,
      qual_module_count: effectiveQual.length,
      respondent_count: respondentCount,
      idea_char_length: ideaCharLength,
    })
  }, [pricing, effectiveQuant.length, effectiveQual.length, respondentCount, ideaCharLength])

  const insufficient = balance != null && estimate != null && estimate.total > balance

  const quantNarrowed = quantIds != null && quantIds.length < allQuantIds.length
  const qualNarrowed = qualIds != null && qualIds.length < allQualIds.length
  const respondentNarrowed = respondentCount !== 12
  const hasSelection = quantNarrowed || qualNarrowed || respondentNarrowed

  function toggleQuant(id: string) {
    const current = quantIds ?? allQuantIds
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    onQuantChange(next.length === allQuantIds.length ? null : next)
  }

  function toggleQual(id: string) {
    const current = qualIds ?? allQualIds
    const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
    onQualChange(next.length === allQualIds.length ? null : next)
  }

  const anchorLabel = hasSelection
    ? [
        `${effectiveQuant.length} metric${effectiveQuant.length === 1 ? '' : 's'}`,
        `${effectiveQual.length} module${effectiveQual.length === 1 ? '' : 's'}`,
        `${respondentCount} resp.`,
      ].join(' · ')
    : 'Research settings'

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '20px',
          border: hasSelection ? '1.5px solid #1a1a1a' : '1.5px solid #d1d1d1',
          background: hasSelection ? '#1a1a1a' : '#fff',
          color: hasSelection ? '#fff' : '#666',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          whiteSpace: 'nowrap',
          transition: 'all 0.15s',
        }}
      >
        <span>{anchorLabel}</span>
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
            position: 'fixed',
            ...panelStyle,
            background: '#fff',
            border: '1px solid #e5e5e5',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            width: '440px',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
          }}
        >
          {loading && (
            <div style={{ padding: '20px', fontSize: '13px', color: '#999', textAlign: 'center' }}>Loading…</div>
          )}

          {!loading && (
            <>
              {/* Scrollable metrics + modules area */}
              <div style={{ overflowY: 'auto', padding: '14px 14px 0', flex: '1 1 auto', minHeight: 0 }}>
                <Section
                  title="Metrics"
                  items={quantMetrics.map((m) => ({ id: m.id, label: m.name }))}
                  selectedIds={effectiveQuant}
                  onToggle={toggleQuant}
                  onSelectAll={() => onQuantChange(null)}
                  onClear={() => onQuantChange([])}
                />

                <Section
                  title="Qualitative modules"
                  items={qualModules.map((m) => ({ id: m.id, label: m.name }))}
                  selectedIds={effectiveQual}
                  onToggle={toggleQual}
                  onSelectAll={() => onQualChange(null)}
                  onClear={() => onQualChange([])}
                />
              </div>

              {/* Fixed bottom: respondents + estimate + summary — never scrolls away */}
              <div style={{ padding: '0 14px 14px', flexShrink: 0 }}>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #f0f0f0' }}>
                  <div style={sectionHeaderStyle}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>Respondents</div>
                    <div style={{ fontSize: 12, color: '#666', fontWeight: 600 }}>{respondentCount}</div>
                  </div>
                  <input
                    type="range"
                    min={RESPONDENT_MIN}
                    max={RESPONDENT_MAX}
                    value={respondentCount}
                    onChange={(e) => onRespondentCountChange(Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#1a1a1a' }}
                  />
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4, lineHeight: 1.4 }}>
                    How many synthetic respondents feed the qual modules.
                  </div>
                </div>

                {estimate && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: '12px 14px',
                      background: insufficient ? '#FFE1E6' : '#F3F5F8',
                      borderRadius: 10,
                      fontSize: 12,
                      color: insufficient ? '#C4335A' : '#333',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ fontWeight: 600 }}>Estimated cost</span>
                      <span style={{ fontWeight: 800, fontSize: 14 }}>
                        ≈ {estimate.total.toLocaleString()} credits
                      </span>
                    </div>
                    <div style={{ marginTop: 6, fontSize: 11, color: insufficient ? '#C4335A' : '#888', lineHeight: 1.5 }}>
                      Base {estimate.breakdown.base} ·
                      {' '}metrics {estimate.breakdown.quant} ·
                      {' '}modules {estimate.breakdown.qual} ·
                      {' '}respondents {estimate.breakdown.respondents} ·
                      {' '}idea {estimate.breakdown.idea}
                    </div>
                    {balance != null && (
                      <div style={{ marginTop: 4, fontSize: 11, color: insufficient ? '#C4335A' : '#888' }}>
                        Balance: {balance.toLocaleString()} credits
                        {insufficient && ' — not enough; ask your admin to top up.'}
                      </div>
                    )}
                  </div>
                )}

                <div
                  style={{
                    marginTop: 14,
                    padding: '10px 12px',
                    background: '#fafafa',
                    borderRadius: 10,
                    fontSize: 12,
                    color: '#666',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span>
                    {respondentCount} resp. · {effectiveQuant.length} metric{effectiveQuant.length === 1 ? '' : 's'} ·{' '}
                    {effectiveQual.length} module{effectiveQual.length === 1 ? '' : 's'}
                  </span>
                  {hasSelection && (
                    <button
                      type="button"
                      onClick={() => {
                        onQuantChange(null)
                        onQualChange(null)
                        onRespondentCountChange(12)
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#1a1a1a',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        padding: 0,
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function Section({
  title,
  items,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
}: {
  title: string
  items: Array<{ id: string; label: string }>
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClear: () => void
}) {
  if (items.length === 0) return null
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={sectionHeaderStyle}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1a1a1a' }}>{title}</div>
        <div style={{ display: 'flex', gap: 10, fontSize: 11 }}>
          <button type="button" onClick={onSelectAll} style={linkBtnStyle}>
            Select all
          </button>
          <button type="button" onClick={onClear} style={linkBtnStyle}>
            Clear
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {items.map((item) => {
          const selected = selectedIds.includes(item.id)
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggle(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                background: selected ? '#f5f5f5' : 'transparent',
                border: '1px solid transparent',
                borderRadius: 8,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 12,
                color: '#1a1a1a',
                lineHeight: 1.3,
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!selected) (e.currentTarget as HTMLElement).style.background = '#f9f9f9'
              }}
              onMouseLeave={(e) => {
                if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: 4,
                  border: selected ? '1.5px solid #1a1a1a' : '1.5px solid #c0c0c0',
                  background: selected ? '#1a1a1a' : '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontSize: 9,
                  fontWeight: 800,
                  flexShrink: 0,
                }}
              >
                {selected ? '✓' : ''}
              </span>
              <span style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

const sectionHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 8,
}

const linkBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  color: '#666',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
}
