'use client'

import { TestContext } from '@/lib/types'
import { accentMap, useAudiences } from '@/lib/personas'
import { ideaTypeLabel } from '@/lib/history'
import { SX, FONT, PAGE_W } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import Glyphs from '@/components/design/Glyphs'
import { BtnGhost } from '@/components/design/Btn'

interface Props {
  ideaText: string
  personaIds: string[]
  context: TestContext
  onEdit: () => void
}

// Compact "idea panel" shown at the top of Stage 3.
// Tint background, square pill audience chip, ink type pill, brief context tags, Edit ghost btn.
export default function SetupSummary({ ideaText, personaIds, context, onEdit }: Props) {
  const { byId } = useAudiences()
  const selected = personaIds
    .map(byId)
    .filter((a): a is NonNullable<ReturnType<typeof byId>> => !!a)

  const contextTags: string[] = Object.values(context.brief ?? {})
    .flatMap((v) => {
      if (typeof v === 'string') return v.trim().length > 0 ? [v] : []
      if (Array.isArray(v)) return v.map(String).filter((s) => s.trim().length > 0)
      return []
    })
    .slice(0, 2)
    .map((v) => (v.length > 28 ? v.slice(0, 28) + '…' : v))

  return (
    <div
      style={{
        background: SX.tint,
        borderBottom: `1px solid ${SX.hair}`,
      }}
    >
      <div
        style={{
          maxWidth: PAGE_W,
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          height: 56,
          overflow: 'hidden',
        }}
      >
        {/* Glyph mark */}
        <Glyphs size={14} />

        {/* Audience chip(s) */}
        {selected.length === 1 && (() => {
          const audience = selected[0]
          const accent = accentMap[audience.accentColor] ?? accentMap.indigo
          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
              <div
                style={{
                  width: 26,
                  height: 26,
                  background: accent.avatarBg,
                  color: accent.avatarText,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                }}
                aria-hidden
              >
                {audience.emoji}
              </div>
              <span
                style={{
                  fontFamily: FONT.grotesque,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: SX.ink,
                  letterSpacing: '-0.005em',
                  whiteSpace: 'nowrap',
                }}
              >
                {audience.name}
              </span>
            </div>
          )
        })()}

        {selected.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 'none' }}>
            <div style={{ display: 'flex' }}>
              {selected.slice(0, 4).map((audience, i) => {
                const accent = accentMap[audience.accentColor] ?? accentMap.indigo
                return (
                  <div
                    key={audience.id}
                    style={{
                      width: 24,
                      height: 24,
                      background: accent.avatarBg,
                      color: accent.avatarText,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      border: `2px solid ${SX.tint}`,
                      marginLeft: i === 0 ? 0 : -6,
                      zIndex: selected.length - i,
                      position: 'relative',
                    }}
                    aria-hidden
                  >
                    {audience.emoji}
                  </div>
                )
              })}
            </div>
            <Cap color={SX.ink} size={11}>
              {selected.length} audiences
            </Cap>
          </div>
        )}

        <div style={{ width: 1, height: 22, background: SX.hair, flex: 'none' }} />

        {/* Idea-type pill (accent border + caps) */}
        <span
          style={{
            border: `1px solid ${SX.accent}`,
            padding: '3px 8px',
            fontFamily: FONT.grotesque,
            fontSize: 9.5,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: SX.accent,
            flex: 'none',
          }}
        >
          {ideaTypeLabel(context.ideaType)}
        </span>

        {/* Idea text */}
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontFamily: FONT.grotesque,
            fontSize: 13.5,
            color: SX.ink,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {ideaText}
        </span>

        {/* Brief context tags (compact) */}
        {contextTags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
            {contextTags.map((tag, i) => (
              <span
                key={i}
                style={{
                  border: `1px solid ${SX.hair}`,
                  padding: '3px 8px',
                  fontFamily: FONT.grotesque,
                  fontSize: 11,
                  color: SX.soft,
                  whiteSpace: 'nowrap',
                  maxWidth: 180,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
                title={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Edit ghost */}
        <BtnGhost onClick={onEdit} style={{ flex: 'none', padding: '6px 14px' }}>
          Edit
        </BtnGhost>
      </div>
    </div>
  )
}
