'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase'

interface Props {
  token: string
  email: string
  kind: 'company' | 'bnt'
}

const ERRORS: Record<string, string> = {
  EXISTING_ACCOUNT_WRONG_PASSWORD:
    'An account already exists for this email. Enter its existing password to accept the invite.',
  INVITE_ALREADY_ACCEPTED: 'This invitation has already been used.',
  INVITE_EXPIRED: 'This invitation has expired. Ask your admin for a new one.',
  INVITE_NOT_FOUND: 'This invitation link is not valid.',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
}

export default function AcceptForm({ token, email, kind }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    // The account is created server-side by this endpoint (service key), so
    // onboarding doesn't depend on public sign-ups being enabled and no
    // confirmation email is ever sent. Then we sign in with the same password.
    const res = await fetch(`/api/accept-invite/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName.trim(), password }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(ERRORS[body?.error as string] ?? body?.error ?? `accept failed: ${res.status}`)
      setLoading(false)
      return
    }

    const supabase = supabaseBrowser()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      // The account exists and the invite is accepted; only the session failed.
      router.push('/login')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Field label="Email">
        <input value={email} disabled style={{ ...inputStyle, background: '#f5f5f5', color: '#888' }} />
      </Field>

      <Field label="Your name">
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Jane Smith"
          required
          autoFocus
          style={inputStyle}
        />
      </Field>

      <Field label="Choose a password">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          minLength={8}
          required
          style={inputStyle}
        />
      </Field>

      {error && <p style={{ fontSize: 12, color: '#C4335A', margin: 0 }}>{error}</p>}

      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 4,
          padding: '11px 18px',
          borderRadius: 10,
          border: 'none',
          background: loading ? '#b0c9b4' : '#1a1a1a',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
          cursor: loading ? 'default' : 'pointer',
        }}
      >
        {loading ? 'Creating account…' : 'Accept invitation'}
      </button>
    </form>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>
        {label}
      </span>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
  borderRadius: 10,
  border: '1.5px solid #e5e5e5',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
}
