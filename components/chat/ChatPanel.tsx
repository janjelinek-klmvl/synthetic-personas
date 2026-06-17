'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ChatMode } from '@/lib/types-as'
import type { ChatMessageRow } from '@/app/api/runs/[id]/chat/messages/route'
import ChatMessage from './ChatMessage'
import ChatComposer from './ChatComposer'
import { SX, FONT, TNUM } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Props {
  /** SP run id (sp_runs.id). */
  spRunId: string
  /** Which audience to chat with for audience mode. */
  audienceId: string | null
  /** Display name for the audience above (e.g. "Pilsner Prague Beer Drinkers"). */
  audienceName: string | null
  /** Max selectable respondents for audience mode (= original run.respondent_count). */
  maxRespondents: number
}

interface FetchState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  messages: ChatMessageRow[]
  error: string | null
}

export default function ChatPanel({ spRunId, audienceId, audienceName, maxRespondents }: Props) {
  const [state, setState] = useState<FetchState>({ status: 'idle', messages: [], error: null })
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [balance, setBalance] = useState<number | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let cancelled = false
    setState((s) => ({ ...s, status: 'loading', error: null }))
    fetch(`/api/runs/${encodeURIComponent(spRunId)}/chat/messages`)
      .then(async (r) => {
        const body = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(body?.error ?? `HTTP ${r.status}`)
        return body as { conversation_id: string; messages: ChatMessageRow[] }
      })
      .then((body) => {
        if (cancelled) return
        setState({ status: 'ready', messages: body.messages, error: null })
      })
      .catch((err) => {
        if (cancelled) return
        setState({ status: 'error', messages: [], error: (err as Error).message })
      })
    return () => {
      cancelled = true
    }
  }, [spRunId])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [state.messages.length, sending])

  const submit = useCallback(
    async (content: string, mode: ChatMode, respondentCount?: number) => {
      setSending(true)
      setSendError(null)
      try {
        const res = await fetch(`/api/runs/${encodeURIComponent(spRunId)}/chat/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            content,
            audience_id: audienceId,
            respondent_count: mode === 'audience' ? respondentCount : undefined,
          }),
        })
        const body = await res.json().catch(() => ({}))
        if (!res.ok) {
          const fallbackUser = body?.user_message as ChatMessageRow | undefined
          if (fallbackUser) {
            setState((s) => ({ ...s, messages: [...s.messages, fallbackUser] }))
          }
          throw new Error(body?.error ?? `HTTP ${res.status}`)
        }
        const data = body as {
          user_message: ChatMessageRow
          assistant_message: ChatMessageRow
          balance: number
        }
        setState((s) => ({
          ...s,
          messages: [...s.messages, data.user_message, data.assistant_message],
        }))
        setBalance(data.balance)
      } catch (err) {
        setSendError((err as Error).message)
      } finally {
        setSending(false)
      }
    },
    [spRunId, audienceId],
  )

  const audienceAvailable = audienceId != null && maxRespondents > 0
  const headerLabel = useMemo(() => {
    if (audienceName) return `Chat · ${audienceName}`
    return 'Chat'
  }, [audienceName])

  return (
    <section
      style={{
        border: `1px solid ${SX.ink}`,
        background: SX.paper,
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '76vh',
        minHeight: 460,
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: `1px solid ${SX.ink}`,
          gap: 12,
          flex: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Cap size={10.5}>{headerLabel}</Cap>
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 11.5,
              color: SX.soft,
              lineHeight: 1.5,
            }}
          >
            Ask the report any question — or switch to{' '}
            <em style={{ fontStyle: 'italic', color: SX.ink }}>Ask the audience</em> to re-prompt the
            synthetic respondents.
          </div>
        </div>
        {balance != null && (
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 10,
              fontWeight: 700,
              color: SX.soft,
              border: `1px solid ${SX.hair}`,
              padding: '4px 10px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              whiteSpace: 'nowrap',
              ...TNUM,
            }}
          >
            {balance.toLocaleString()} credits
          </div>
        )}
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {state.status === 'loading' && <MutedRow>Loading conversation…</MutedRow>}
        {state.status === 'error' && (
          <MutedRow color={SX.accent}>Could not load chat: {state.error}</MutedRow>
        )}
        {state.status === 'ready' && state.messages.length === 0 && !sending && (
          <div style={{ margin: 'auto', maxWidth: 460, textAlign: 'center' }}>
            <Cap color={SX.accent} size={10}>
              Two ways to ask
            </Cap>
            <div
              style={{
                marginTop: 12,
                fontFamily: FONT.grotesque,
                fontSize: 13.5,
                lineHeight: 1.6,
                color: SX.soft,
              }}
            >
              <strong style={{ color: SX.ink }}>The Report</strong> answers from the scored signals
              and coded themes above.
              <br />
              <br />
              <strong style={{ color: SX.ink }}>The Audience</strong> answers in character — pick a
              respondent count and put your question to them directly.
            </div>
          </div>
        )}
        {state.messages.map((m) => (
          <ChatMessage key={m.id} message={m} />
        ))}
        {sending && (
          <div style={{ alignSelf: 'flex-start' }}>
            <span className="sx-pulse" style={{ display: 'inline-flex', gap: 4 }}>
              <span />
              <span />
              <span />
            </span>
          </div>
        )}
        {sendError && !sending && <MutedRow color={SX.accent}>Send failed: {sendError}</MutedRow>}
      </div>

      <ChatComposer
        disabled={sending || state.status !== 'ready'}
        audienceAvailable={audienceAvailable}
        maxRespondents={maxRespondents}
        onSubmit={submit}
      />
    </section>
  )
}

function MutedRow({ children, color = SX.soft }: { children: React.ReactNode; color?: string }) {
  return (
    <div
      style={{
        fontFamily: FONT.grotesque,
        fontSize: 12.5,
        color,
        textAlign: 'center',
        padding: '24px 8px',
        fontStyle: 'italic',
      }}
    >
      {children}
    </div>
  )
}
