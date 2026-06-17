'use client'

import { useMemo } from 'react'
import { useAudiences } from '@/lib/personas'
import { estimateCredits } from '@/lib/estimate'
import type { IdeaType } from '@/lib/stimulus'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { BtnPrimary } from '@/components/design/Btn'

export const RESPONDENT_OPTIONS = [6, 12, 18, 24] as const
export type RespondentChoice = (typeof RESPONDENT_OPTIONS)[number]

interface Props {
  quantIds: string[] | null // null = all
  qualIds: string[] | null
  respondentCount: number
  ideaCharLength: number
  ideaType: IdeaType | null
  audienceCount: number // for total cost summary
  onQuantChange: (ids: string[] | null) => void
  onQualChange: (ids: string[] | null) => void
  onRespondentCountChange: (n: number) => void
  onConfirm: () => void
}

// Body of the Research scope drawer.
// Two-column body (Metrics 3-col / Modules 2-col) + footer (segmented
// respondents + cost + Confirm).
export default function ResearchScopeDrawer({
  quantIds,
  qualIds,
  respondentCount,
  ideaCharLength,
  ideaType,
  audienceCount,
  onQuantChange,
  onQualChange,
  onRespondentCountChange,
  onConfirm,
}: Props) {
  const { quantMetrics: allQuant, qualModules: allQual, pricing, balance, loading } = useAudiences()

  const quantMetrics = useMemo(() => {
    if (!ideaType) return allQuant
    return allQuant.filter((m) => {
      const t = m.applicable_stimulus_types
      return !t || t.length === 0 || t.includes(ideaType)
    })
  }, [allQuant, ideaType])
  const qualModules = useMemo(() => {
    if (!ideaType) return allQual
    return allQual.filter((m) => {
      const t = m.applicable_stimulus_types
      return !t || t.length === 0 || t.includes(ideaType)
    })
  }, [allQual, ideaType])

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

  const totalCost = (estimate?.total ?? 0) * Math.max(1, audienceCount)
  const insufficient = balance != null && totalCost > balance

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

  if (loading) {
    return (
      <div
        style={{
          padding: '40px 26px',
          textAlign: 'center',
          fontFamily: FONT.grotesque,
          fontSize: 13,
          color: SX.soft,
        }}
      >
        Loading metric library…
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', borderBottom: `1px solid ${SX.ink}` }}>
        {/* Metrics column */}
        <div style={{ padding: '22px 22px 24px', borderRight: `1px solid ${SX.hair}` }}>
          <SectionHeader
            title="Metrics"
            subtitle="Quant signals · one score each"
            n={effectiveQuant.length}
            total={quantMetrics.length}
            onAll={() => onQuantChange(null)}
            onClear={() => onQuantChange([])}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              columnGap: 18,
              rowGap: 2,
              marginTop: 12,
            }}
          >
            {quantMetrics.map((m) => (
              <CheckRow
                key={m.id}
                label={m.name}
                selected={effectiveQuant.includes(m.id)}
                onToggle={() => toggleQuant(m.id)}
              />
            ))}
          </div>
        </div>

        {/* Qual modules column */}
        <div style={{ padding: '22px 22px 24px' }}>
          <SectionHeader
            title="Qual modules"
            subtitle="Cross-respondent patterns"
            n={effectiveQual.length}
            total={qualModules.length}
            onAll={() => onQualChange(null)}
            onClear={() => onQualChange([])}
          />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              columnGap: 14,
              rowGap: 2,
              marginTop: 12,
            }}
          >
            {qualModules.map((m) => (
              <CheckRow
                key={m.id}
                label={m.name}
                selected={effectiveQual.includes(m.id)}
                onToggle={() => toggleQual(m.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 18,
          padding: '14px 22px',
          flexWrap: 'wrap',
        }}
      >
        {/* Respondents */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Cap color={SX.soft} size={10}>
            Respondents
          </Cap>
          <div style={{ display: 'flex', border: `1px solid ${SX.ink}` }}>
            {RESPONDENT_OPTIONS.map((n, i) => {
              const on = n === respondentCount
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => onRespondentCountChange(n)}
                  style={{
                    minWidth: 38,
                    padding: '6px 10px',
                    border: 'none',
                    borderLeft: i === 0 ? 'none' : `1px solid ${SX.ink}`,
                    background: on ? SX.ink : 'transparent',
                    color: on ? SX.paper : SX.ink,
                    fontFamily: FONT.grotesque,
                    fontSize: 12.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'background 120ms, color 120ms',
                    ...TNUM,
                  }}
                >
                  {n}
                </button>
              )
            })}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Estimate */}
        <div style={{ textAlign: 'right' }}>
          <Cap color={SX.soft} size={9.5}>
            Est. cost
          </Cap>
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 22,
              fontWeight: 800,
              color: insufficient ? SX.accent : SX.ink,
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginTop: 4,
              ...TNUM,
            }}
          >
            ≈ {totalCost.toLocaleString()} cr
          </div>
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 10,
              color: insufficient ? SX.accent : SX.faint,
              marginTop: 4,
              letterSpacing: '0.02em',
              ...TNUM,
            }}
          >
            {effectiveQuant.length} metric{effectiveQuant.length === 1 ? '' : 's'} ·{' '}
            {effectiveQual.length} module{effectiveQual.length === 1 ? '' : 's'} · {respondentCount} resp.
            {balance != null && ` · balance ${balance.toLocaleString()}`}
            {audienceCount > 1 && ` · ×${audienceCount} audiences`}
          </div>
        </div>

        <BtnPrimary onClick={onConfirm}>Confirm</BtnPrimary>
      </div>
    </div>
  )
}

function SectionHeader({
  title,
  subtitle,
  n,
  total,
  onAll,
  onClear,
}: {
  title: string
  subtitle: string
  n: number
  total: number
  onAll: () => void
  onClear: () => void
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <Cap color={SX.soft} size={10}>
          {title} <span style={{ color: SX.ink, ...TNUM }}>{n}/{total}</span>
        </Cap>
        <div
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 11,
            color: SX.faint,
            marginTop: 3,
          }}
        >
          {subtitle}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 14 }}>
        <LinkBtn onClick={onAll}>All</LinkBtn>
        <LinkBtn onClick={onClear}>Clear</LinkBtn>
      </div>
    </div>
  )
}

function LinkBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="sx-link"
      style={{
        background: 'none',
        border: 'none',
        color: SX.soft,
        fontFamily: FONT.grotesque,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        cursor: 'pointer',
        padding: 0,
      }}
    >
      {children}
    </button>
  )
}

function CheckRow({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="sx-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '7px 4px',
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 120ms',
      }}
    >
      <span
        style={{
          width: 14,
          height: 14,
          border: `1.5px solid ${selected ? SX.accent : SX.faint}`,
          background: selected ? SX.accent : 'transparent',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: SX.paper,
          fontSize: 9,
          fontWeight: 800,
          flexShrink: 0,
        }}
        aria-hidden
      >
        {selected ? '✓' : ''}
      </span>
      <span
        style={{
          fontFamily: FONT.grotesque,
          fontSize: 12.5,
          fontWeight: selected ? 700 : 500,
          color: selected ? SX.ink : SX.soft,
          lineHeight: 1.3,
          flex: 1,
          minWidth: 0,
        }}
      >
        {label}
      </span>
    </button>
  )
}
