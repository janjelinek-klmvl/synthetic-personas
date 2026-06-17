'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase'

interface Props {
  token: string
  email: string
  kind: 'company' | 'bnt'
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

    const supabase = supabaseBrowser()

    // Try sign up first. If an auth.users row already exists for this email
    // (e.g. user signed up elsewhere), fall back to signing in.
    let userId: string | null = null
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpError && /already|registered/i.test(signUpError.message)) {
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) {
        setError(
          'An account exists for this email but the password is wrong. Use your existing password.',
        )
        setLoading(false)
        return
      }
      userId = signInData.user?.id ?? null
    } else if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    } else {
      userId = signUpData.user?.id ?? null
    }

    if (!userId) {
      setError('Could not establish a session. Please try again.')
      setLoading(false)
      return
    }

    const res = await fetch(`/api/accept-invite/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName.trim() }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setError(body?.error ?? `accept failed: ${res.status}`)
      setLoading(false)
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
