'use client'

import { useState, useRef, useEffect } from 'react'
import { Persona } from '@/lib/types'
import { accentMap } from '@/lib/personas'
import { TestContext } from '@/lib/types'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface Props {
  persona: Persona
  ideaText: string
  context: TestContext
}

export default function PersonaChat({ persona, ideaText, context }: Props) {
  const [messages, setMessages]   = useState<Message[]>([])
  const [input, setInput]         = useState('')
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLTextAreaElement>(null)
  const accent = accentMap[persona.accentColor] ?? accentMap.indigo

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streaming])

  async function send() {
    const text = input.trim()
    if (!text || streaming) return

    const userMsg: Message = { role: 'user', content: text }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setStreaming(true)

    // Placeholder for streaming response
    setMessages(prev => [...prev, { role: 'assistant', content: '' }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personaId: persona.id,
          ideaText,
          context,
          messages: newMessages,
        }),
      })

      if (!res.ok || !res.body) throw new Error('Request failed')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let full = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        full += decoder.decode(value, { stream: true })
        setMessages(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { role: 'assistant', content: full }
          return updated
        })
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev]
        updated[updated.length - 1] = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }
        return updated
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div style={{
      background: '#fff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>

      {/* Header */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex', alignItems: 'center', gap: '10px',
        background: accent.avatarBg,
      }}>
        <div style={{
          width: '34px', height: '34px', borderRadius: '10px',
          background: '#fff', opacity: 0.8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px',
        }}>
          {persona.emoji}
        </div>
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: accent.avatarText }}>
            {persona.name}
          </div>
          <div style={{ fontSize: '11px', color: accent.avatarText, opacity: 0.7 }}>
            {persona.tagline}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{
        padding: '20px',
        display: 'flex', flexDirection: 'column', gap: '16px',
        minHeight: '200px',
        maxHeight: '480px',
        overflowY: 'auto',
      }}>
        {messages.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '32px 16px',
            color: 'var(--text-disabled)', fontSize: '13px',
          }}>
            Ask {persona.name.split(' ')[0]} anything about their reaction to your idea.
          </div>
        )}

        {messages.map((msg, i) => {
          const isUser = msg.role === 'user'
          const isLastAssistant = !isUser && i === messages.length - 1

          return (
            <div key={i} style={{
              display: 'flex',
              justifyContent: isUser ? 'flex-end' : 'flex-start',
              gap: '8px',
              alignItems: 'flex-end',
            }}>
              {/* Persona avatar */}
              {!isUser && (
                <div style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: accent.avatarBg, color: accent.avatarText,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', flexShrink: 0,
                }}>
                  {persona.emoji}
                </div>
              )}

              <div style={{
                maxWidth: '72%',
                padding: '10px 14px',
                borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isUser ? '#1a1a1a' : '#f5f5f5',
                color: isUser ? '#fff' : 'var(--text-primary)',
                fontSize: '13px', lineHeight: 1.55,
                wordBreak: 'break-word',
              }}>
                {msg.content || (isLastAssistant && streaming ? (
                  <span style={{ display: 'inline-flex', gap: '3px', alignItems: 'center', padding: '2px 0' }}>
                    {[0, 1, 2].map(j => (
                      <span key={j} style={{
                        width: '5px', height: '5px', borderRadius: '50%',
                        background: '#aaa',
                        display: 'inline-block',
                        animation: `chatDot 1.2s ease-in-out ${j * 0.2}s infinite`,
                      }} />
                    ))}
                    <style>{`@keyframes chatDot { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }`}</style>
                  </span>
                ) : '—')}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        borderTop: '1px solid #f0f0f0',
        padding: '12px 16px',
        display: 'flex', gap: '8px', alignItems: 'flex-end',
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${persona.name.split(' ')[0]} a follow-up…`}
          rows={1}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: '12px',
            border: '1.5px solid #e5e5e5',
            fontSize: '13px', lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
            color: 'var(--text-primary)',
            background: '#fff',
            transition: 'border-color 0.15s',
            overflowY: 'hidden',
          }}
          onFocus={e => (e.target.style.borderColor = '#1a1a1a')}
          onBlur={e => (e.target.style.borderColor = '#e5e5e5')}
          onInput={e => {
            const el = e.currentTarget
            el.style.height = 'auto'
            el.style.height = Math.min(el.scrollHeight, 120) + 'px'
          }}
          disabled={streaming}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || streaming}
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            border: 'none',
            background: input.trim() && !streaming ? '#1a1a1a' : '#e5e5e5',
            color: input.trim() && !streaming ? '#fff' : '#aaa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: input.trim() && !streaming ? 'pointer' : 'default',
            transition: 'all 0.15s', flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 7h12M7 1l6 6-6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

    </div>
  )
}
