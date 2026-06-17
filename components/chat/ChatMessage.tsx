'use client'

import type { ChatMessageRow } from '@/app/api/runs/[id]/chat/messages/route'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Props {
  message: ChatMessageRow
}

// Chat message bubble. User = ink-filled square block. Assistant = paper
// block with thin hair border + caps "WHO" label above.
export default function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user'
  const isAudience = message.mode === 'audience'

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <div
          style={{
            alignSelf: 'flex-end',
            maxWidth: '84%',
            background: SX.ink,
            color: SX.paper,
            padding: '10px 14px',
            fontFamily: FONT.grotesque,
            fontSize: 13.5,
            lineHeight: 1.5,
            whiteSpace: 'pre-wrap',
          }}
        >
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <Cap color={isAudience ? SX.accent : SX.faint} size={9} ls="0.16em">
          {isAudience ? 'The audience' : 'The report'}
        </Cap>
        {typeof message.credits_charged === 'number' && message.credits_charged > 0 && (
          <Cap color={SX.faint} size={9} style={{ ...TNUM }}>
            {message.credits_charged} {message.credits_charged === 1 ? 'credit' : 'credits'}
          </Cap>
        )}
      </div>

      <div
        style={{
          marginTop: 6,
          fontFamily: FONT.grotesque,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: SX.ink,
          whiteSpace: 'pre-wrap',
        }}
      >
        {message.content}
      </div>

      {isAudience && message.respondent_evidence && message.respondent_evidence.length > 0 && (
        <details style={{ marginTop: 14 }}>
          <summary
            style={{
              cursor: 'pointer',
              fontFamily: FONT.grotesque,
              fontSize: 10,
              fontWeight: 700,
              color: SX.accent,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              userSelect: 'none',
              outline: 'none',
              listStyle: 'none',
              ...TNUM,
            }}
          >
            {message.respondent_evidence.length}{' '}
            {message.respondent_evidence.length === 1 ? 'respondent answered' : 'respondents answered'}
            {' ↓'}
          </summary>
          <ol
            style={{
              margin: '10px 0 0 0',
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {message.respondent_evidence.map((e) => (
              <li
                key={e.respondent_id}
                style={{
                  border: `1px solid ${SX.hair}`,
                  background: SX.tint,
                  padding: '10px 12px',
                  fontFamily: FONT.grotesque,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 5,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.grotesque,
                      fontSize: 12,
                      fontWeight: 700,
                      color: SX.ink,
                    }}
                  >
                    {e.persona_name}
                  </span>
                  {e.state_label && (
                    <Cap color={SX.faint} size={9}>
                      {e.state_label}
                    </Cap>
                  )}
                </div>
                <div
                  style={{
                    fontFamily: FONT.serif,
                    fontStyle: 'italic',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    color: SX.ink,
                  }}
                >
                  &ldquo;{e.answer}&rdquo;
                </div>
              </li>
            ))}
          </ol>
        </details>
      )}
    </div>
  )
}
