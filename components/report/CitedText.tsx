'use client'

import { Fragment, type ReactNode } from 'react'
import type { ReportChunk } from '@/lib/types-as'
import { SX, FONT, TNUM } from '@/lib/design/tokens'

// Matches a bracketed group of one or more research-chunk IDs (full UUIDs or
// 8+ hex-char prefixes), e.g. "[38ae69f9, 9507882b]" or
// "[788c39cb-0396-4c85-9f54-f88154d044a5]". Restricted to hex tokens so it
// never swallows ordinary prose brackets.
const TOKEN = '[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4,12}){0,4}'
const GROUP_RE = new RegExp(`\\s*\\[\\s*${TOKEN}(?:\\s*,\\s*${TOKEN})*\\s*\\]`, 'g')
const SPLIT_TOKENS_RE = new RegExp(TOKEN, 'g')

function resolveChunk(token: string, chunks: ReportChunk[]): ReportChunk | undefined {
  const t = token.toLowerCase()
  let prefix: ReportChunk | undefined
  for (const c of chunks) {
    const id = c.id.toLowerCase()
    if (id === t) return c
    if (!prefix && (id.startsWith(t) || t.startsWith(id))) prefix = c
  }
  return prefix
}

// Renders prose with inline research-chunk citations turned into clickable
// numbered chips. Unresolvable codes (or any code when chunks are absent) are
// stripped so raw UUIDs never reach the reader.
export default function CitedText({
  text,
  chunks,
  onCite,
}: {
  text: string
  chunks?: ReportChunk[]
  onCite?: (chunk: ReportChunk) => void
}): ReactNode {
  if (!text) return text
  const pool = chunks ?? []
  const numbers = new Map<string, number>() // chunk.id → citation number
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0

  const matches = Array.from(text.matchAll(GROUP_RE))
  for (const m of matches) {
    const start = m.index ?? 0
    const raw = m[0]
    // Text before this group (the leading whitespace is part of the match).
    if (start > last) nodes.push(<Fragment key={key++}>{text.slice(last, start)}</Fragment>)
    last = start + raw.length

    const tokens: string[] = raw.match(SPLIT_TOKENS_RE) ?? []
    const resolved = tokens
      .map((t) => resolveChunk(t, pool))
      .filter((c): c is ReportChunk => c != null)

    if (resolved.length === 0) {
      // Strip entirely. Re-insert a single space only when wedged directly
      // between two alphanumerics (e.g. "word[code]word"), never before
      // punctuation ("merit [code]." must stay "merit.").
      const before = text[start - 1]
      const after = text[last]
      if (before && after && /[A-Za-z0-9]/.test(before) && /[A-Za-z0-9]/.test(after)) {
        nodes.push(<Fragment key={key++}> </Fragment>)
      }
      continue
    }

    nodes.push(
      <sup key={key++} style={{ whiteSpace: 'nowrap' }}>
        {resolved.map((chunk, i) => {
          if (!numbers.has(chunk.id)) numbers.set(chunk.id, numbers.size + 1)
          const n = numbers.get(chunk.id) as number
          return (
            <Fragment key={chunk.id + i}>
              {i > 0 && <span style={{ color: SX.faint }}>·</span>}
              <button
                type="button"
                title={`${chunk.source_title} — ${chunk.topic}`}
                onClick={() => onCite?.(chunk)}
                className="sx-cite"
                style={{
                  cursor: 'pointer',
                  border: 'none',
                  background: 'transparent',
                  padding: '0 1px',
                  fontFamily: FONT.grotesque,
                  fontSize: 10,
                  fontWeight: 800,
                  lineHeight: 1,
                  color: SX.accent,
                  ...(TNUM as React.CSSProperties),
                }}
              >
                {n}
              </button>
            </Fragment>
          )
        })}
      </sup>,
    )
  }
  if (last < text.length) nodes.push(<Fragment key={key++}>{text.slice(last)}</Fragment>)
  return <>{nodes}</>
}
