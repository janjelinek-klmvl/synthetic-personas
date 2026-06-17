'use client'

import { useAudiences, accentMap } from '@/lib/personas'
import { SX, FONT } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { BtnPrimary } from '@/components/design/Btn'

interface Props {
  value: string[]
  onChange: (ids: string[]) => void
  onDone: () => void
}

// Body of the Audience drawer. Header + 3-column tile grid + Done footer.
export default function AudienceDrawer({ value, onChange, onDone }: Props) {
  const { audiences, loading, error, refresh } = useAudiences()

  function handleToggle(id: string) {
    const next = value.includes(id) ? value.filter((x) => x !== id) : [...value, id]
    onChange(next)
  }

  return (
    <div style={{ padding: '22px 26px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <Cap color={SX.soft} size={10}>
          Audiences · {value.length} selected
        </Cap>
        <Cap color={SX.faint} size={9}>
          From Audience Studio · select one or more
        </Cap>
      </div>

      {loading && (
        <div
          style={{
            padding: '32px 0',
            fontFamily: FONT.grotesque,
            fontSize: 13,
            color: SX.soft,
            textAlign: 'center',
          }}
        >
          Loading audiences from Audience Studio…
        </div>
      )}

      {error && (
        <div
          style={{
            padding: '20px 0',
            fontFamily: FONT.grotesque,
            fontSize: 13,
            color: SX.accent,
          }}
        >
          Could not load audiences: {error}.{' '}
          <button
            type="button"
            onClick={() => {
              void refresh()
            }}
            className="sx-link"
            style={{
              background: 'none',
              border: 'none',
              color: SX.ink,
              textDecoration: 'underline',
              cursor: 'pointer',
              padding: 0,
              fontFamily: FONT.grotesque,
              fontSize: 13,
            }}
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && audiences.length === 0 && (
        <div
          style={{
            padding: '32px 0',
            fontFamily: FONT.grotesque,
            fontSize: 13,
            color: SX.soft,
            textAlign: 'center',
          }}
        >
          No audiences available. Ask your admin to grant access in Audience Studio.
        </div>
      )}

      {!loading && audiences.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          {audiences.map((audience) => {
            const accent = accentMap[audience.accentColor] ?? accentMap.indigo
            const selected = value.includes(audience.id)
            return (
              <button
                key={audience.id}
                type="button"
                onClick={() => handleToggle(audience.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  border: `1.5px solid ${selected ? SX.accent : SX.hair}`,
                  background: selected ? SX.accentSoft : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'border-color 120ms, background 120ms',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  if (!selected) (e.currentTarget as HTMLElement).style.borderColor = SX.ink
                }}
                onMouseLeave={(e) => {
                  if (!selected) (e.currentTarget as HTMLElement).style.borderColor = SX.hair
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
                    width: 32,
                    height: 32,
                    background: accent.avatarBg,
                    color: accent.avatarText,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 17,
                    flexShrink: 0,
                  }}
                  aria-hidden
                >
                  {audience.emoji}
                </span>
                <span style={{ minWidth: 0, flex: 1 }}>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: FONT.grotesque,
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: SX.ink,
                      lineHeight: 1.25,
                      letterSpacing: '-0.005em',
                    }}
                  >
                    {audience.name}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontFamily: FONT.grotesque,
                      fontSize: 10.5,
                      color: SX.soft,
                      marginTop: 3,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {audience.personaCount} {audience.personaCount === 1 ? 'persona' : 'personas'}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      <div
        style={{
          marginTop: 18,
          paddingTop: 14,
          borderTop: `1px solid ${SX.hair}`,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <BtnPrimary onClick={onDone} disabled={value.length === 0}>
          Done · {value.length} selected
        </BtnPrimary>
      </div>
    </div>
  )
}
