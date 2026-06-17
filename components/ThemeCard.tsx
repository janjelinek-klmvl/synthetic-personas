'use client'

import { pickField, severityLabel, severityTone, type SeverityTone } from '@/lib/qualField'

interface Props {
  item: Record<string, unknown>
  onOpen: () => void
}

export default function ThemeCard({ item, onOpen }: Props) {
  const title = pickField(item, 'title')
  const sevRaw = pickField(item, 'severity')
  const tone = severityTone(sevRaw)
  const sevText = severityLabel(sevRaw)
  const body = pickField(item, 'body')
  const quote = pickField(item, 'quote')
  const affected = pickField(item, 'affected')

  return (
    <div style={cardStyle}>
      <div style={topRowStyle}>
        {sevText && <span style={chipStyleFor(tone)}>{sevText}</span>}
        <button type="button" onClick={onOpen} style={infoBtnStyle} aria-label="See full detail" title="See full detail">
          i
        </button>
      </div>

      {title && <div style={titleStyle}>{title}</div>}

      {body && <div style={bodyStyle}>{body}</div>}

      {quote && (
        <blockquote style={quoteStyle}>
          <span style={{ opacity: 0.6, marginRight: 4 }}>“</span>
          {quote.replace(/^['"]|['"]$/g, '')}
          <span style={{ opacity: 0.6, marginLeft: 2 }}>”</span>
        </blockquote>
      )}

      {affected && (
        <div style={footerStyle}>
          <span style={{ fontWeight: 600 }}>Affects:</span> {affected}
        </div>
      )}
    </div>
  )
}

const cardStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #ececec',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  position: 'relative',
}

const topRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 8,
}

const titleStyle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.35,
  color: '#1a1a1a',
}

const bodyStyle: React.CSSProperties = {
  fontSize: 13,
  lineHeight: 1.55,
  color: '#444',
  display: '-webkit-box',
  WebkitLineClamp: 4,
  WebkitBoxOrient: 'vertical',
  overflow: 'hidden',
}

const quoteStyle: React.CSSProperties = {
  margin: 0,
  padding: '6px 0 6px 12px',
  borderLeft: '3px solid #ddd',
  fontStyle: 'italic',
  fontSize: 13,
  color: '#333',
  lineHeight: 1.5,
}

const footerStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#777',
  marginTop: 2,
}

const infoBtnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  borderRadius: 11,
  border: '1px solid #d6d6d6',
  background: '#fff',
  color: '#666',
  fontSize: 11,
  fontWeight: 700,
  fontFamily: 'Georgia, serif',
  fontStyle: 'italic',
  cursor: 'pointer',
  lineHeight: 1,
  flexShrink: 0,
}

function chipStyleFor(tone: SeverityTone): React.CSSProperties {
  const palette: Record<SeverityTone, { bg: string; text: string }> = {
    high:    { bg: '#FFE1E6', text: '#C4335A' },
    med:     { bg: '#FFF3D6', text: '#8A6200' },
    low:     { bg: '#D4EDD4', text: '#2A6A2A' },
    neutral: { bg: '#EFEFEF', text: '#555' },
  }
  const c = palette[tone]
  return {
    display: 'inline-block',
    padding: '3px 10px',
    borderRadius: 10,
    background: c.bg,
    color: c.text,
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  }
}
