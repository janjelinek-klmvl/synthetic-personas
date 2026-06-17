'use client'

import { useCallback, useEffect, useState } from 'react'

interface Member {
  id: string
  role: 'admin' | 'member'
  display_name: string | null
  email: string | null
  is_me: boolean
  created_at: string
}

interface Invitation {
  id: string
  email: string
  role: 'admin' | 'member'
  token: string
  url: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}

export default function TeamClient() {
  const [members, setMembers] = useState<Member[]>([])
  const [invites, setInvites] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'admin' | 'member'>('member')
  const [inviting, setInviting] = useState(false)
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [mRes, iRes] = await Promise.all([
        fetch('/api/team/members', { cache: 'no-store' }),
        fetch('/api/team/invitations', { cache: 'no-store' }),
      ])
      if (!mRes.ok || !iRes.ok) throw new Error('Failed to load team')
      const mBody = await mRes.json()
      const iBody = await iRes.json()
      setMembers(mBody.members ?? [])
      setInvites((iBody.invitations ?? []).filter((i: Invitation) => !i.accepted_at))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    setLastInviteUrl(null)
    try {
      const res = await fetch('/api/team/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body?.error ?? `invite failed: ${res.status}`)
        return
      }
      setInviteEmail('')
      setInviteRole('member')
      setLastInviteUrl(body.invitation?.url ?? null)
      await refresh()
    } finally {
      setInviting(false)
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm('Revoke this invitation?')) return
    await fetch(`/api/team/invitations/${id}`, { method: 'DELETE' })
    void refresh()
  }

  async function handleRemove(id: string) {
    if (!confirm('Remove this member from the company?')) return
    await fetch(`/api/team/members/${id}`, { method: 'DELETE' })
    void refresh()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Invite form */}
      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Invite a teammate</h2>
        <form onSubmit={handleInvite} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Label>Email</Label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              required
              style={inputStyle}
            />
          </div>
          <div>
            <Label>Role</Label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as 'admin' | 'member')}
              style={{ ...inputStyle, paddingRight: 28 }}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={inviting}
            style={{
              padding: '11px 18px',
              borderRadius: 10,
              border: 'none',
              background: inviting ? '#b0c9b4' : '#1a1a1a',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: inviting ? 'default' : 'pointer',
            }}
          >
            {inviting ? 'Sending…' : 'Send invite'}
          </button>
        </form>
        {lastInviteUrl && (
          <div style={inviteUrlStyle}>
            <span style={{ fontSize: 12, color: '#2A6A2A', fontWeight: 600 }}>Invite created:</span>
            <code style={{ fontSize: 12, wordBreak: 'break-all' }}>{lastInviteUrl}</code>
            <button type="button" onClick={() => navigator.clipboard.writeText(lastInviteUrl)} style={smallBtnStyle}>
              Copy
            </button>
          </div>
        )}
      </section>

      {/* Members */}
      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Members</h2>
        {loading ? (
          <p style={{ fontSize: 13, color: '#888' }}>Loading…</p>
        ) : error ? (
          <p style={{ fontSize: 13, color: '#C4335A' }}>{error}</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {members.map((m) => (
              <li key={m.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>
                    {m.display_name || '—'}
                    {m.is_me && <span style={meTagStyle}>You</span>}
                  </div>
                  <div style={{ fontSize: 12, color: '#888' }}>{m.email}</div>
                </div>
                <span style={rolePillStyle(m.role)}>{m.role}</span>
                {!m.is_me && (
                  <button type="button" onClick={() => handleRemove(m.id)} style={dangerBtnStyle}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Pending invites */}
      <section style={panelStyle}>
        <h2 style={sectionTitleStyle}>Pending invitations</h2>
        {invites.length === 0 ? (
          <p style={{ fontSize: 13, color: '#888' }}>None.</p>
        ) : (
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {invites.map((inv) => (
              <li key={inv.id} style={rowStyle}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{inv.email}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>
                    Expires {new Date(inv.expires_at).toLocaleDateString()}
                  </div>
                </div>
                <span style={rolePillStyle(inv.role)}>{inv.role}</span>
                <button type="button" onClick={() => navigator.clipboard.writeText(inv.url)} style={smallBtnStyle}>
                  Copy URL
                </button>
                <button type="button" onClick={() => handleRevoke(inv.id)} style={dangerBtnStyle}>
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
      {children}
    </span>
  )
}

const panelStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  padding: 20,
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
}

const sectionTitleStyle: React.CSSProperties = {
  margin: '0 0 14px 0',
  fontSize: 15,
  fontWeight: 700,
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderRadius: 10,
  border: '1.5px solid #e5e5e5',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  background: '#fff',
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 14px',
  background: '#fafafa',
  borderRadius: 10,
}

const meTagStyle: React.CSSProperties = {
  marginLeft: 8,
  fontSize: 10,
  fontWeight: 700,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  padding: '2px 7px',
  borderRadius: 999,
  background: '#EEF3FE',
  color: '#2E63E0',
}

function rolePillStyle(role: 'admin' | 'member'): React.CSSProperties {
  const c = role === 'admin' ? { bg: '#FFF3D6', fg: '#8A6200' } : { bg: '#EFEFEF', fg: '#555' }
  return {
    fontSize: 10,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    padding: '4px 10px',
    borderRadius: 999,
    background: c.bg,
    color: c.fg,
  }
}

const smallBtnStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #d6d6d6',
  borderRadius: 8,
  padding: '6px 10px',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
}

const dangerBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: '#C4335A',
  fontSize: 12,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
}

const inviteUrlStyle: React.CSSProperties = {
  marginTop: 14,
  padding: 12,
  background: '#E1F4E1',
  borderRadius: 10,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  alignItems: 'flex-start',
}
