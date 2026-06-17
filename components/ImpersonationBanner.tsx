'use client'

import { useEffect, useState } from 'react'

interface MeResponse {
  user: { id: string; email: string | null; display_name: string | null } | null
  company: { id: string; name: string; active: boolean } | null
  role: 'admin' | 'member' | null
  impersonating: boolean
  is_bnt_admin: boolean
}

export default function ImpersonationBanner() {
  const [info, setInfo] = useState<MeResponse | null>(null)
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled) setInfo(d) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  if (!info?.impersonating || !info.company) return null

  async function handleExit() {
    setExiting(true)
    await fetch('/api/impersonate/end', { method: 'POST' })
    // Clearing the cookie kicks a BNT super-admin back to the company picker
    // (rendered on /). A hard navigation forces all server components to
    // re-evaluate without the impersonation cookie.
    window.location.href = '/'
  }

  return (
    <div style={style}>
      <div style={contentStyle}>
        <span style={{ fontWeight: 700, marginRight: 8, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
          Viewing as
        </span>
        <span style={{ fontWeight: 600 }}>{info.company.name}</span>
        <span style={{ opacity: 0.7, marginLeft: 8, fontSize: 10, letterSpacing: '0.04em' }}>
          super-admin{info.user?.email ? ` · ${info.user.email}` : ''}
        </span>
        <button type="button" onClick={handleExit} disabled={exiting} style={btnStyle}>
          {exiting ? 'Exiting…' : 'Exit'}
        </button>
      </div>
    </div>
  )
}

const style: React.CSSProperties = {
  background: '#1A1714', // SX.ink
  color: '#FBFAF7',       // SX.paper
  position: 'sticky',
  top: 0,
  zIndex: 50,
  fontFamily: 'var(--font-archivo), Archivo, system-ui, sans-serif',
  fontSize: 11,
  letterSpacing: '0.04em',
  borderBottom: '1px solid rgba(251,250,247,0.18)',
}

const contentStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 48px',
  maxWidth: 1140,
  margin: '0 auto',
}

const btnStyle: React.CSSProperties = {
  marginLeft: 'auto',
  background: 'transparent',
  color: '#FBFAF7',
  border: '1px solid rgba(251,250,247,0.4)',
  padding: '4px 11px',
  fontFamily: 'var(--font-archivo), Archivo, system-ui, sans-serif',
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
  cursor: 'pointer',
}
