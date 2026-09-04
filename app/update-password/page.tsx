'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase'
import { SX, FONT } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import Logo from '@/components/design/Logo'
import { BtnPrimary } from '@/components/design/Btn'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  // The recovery token arrives in the URL hash. The browser client parses it
  // (detectSessionInUrl) and establishes a recovery session, firing
  // PASSWORD_RECOVERY. Also check for an existing session on mount.
  useEffect(() => {
    const supabase = supabaseBrowser()
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setReady(true)
      }
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    setDone(true)
    setLoading(false)
    setTimeout(() => {
      router.push('/')
      router.refresh()
    }, 1200)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: SX.paper,
        padding: 20,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: SX.paper,
          border: `1px solid ${SX.ink}`,
          padding: '40px 36px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Cap color={SX.accent} size={11}>
            New password
          </Cap>
          <div style={{ marginTop: 12 }}>
            <Logo size={28} />
          </div>
          <div
            style={{
              marginTop: 8,
              fontFamily: FONT.grotesque,
              fontSize: 13,
              color: SX.soft,
            }}
          >
            Choose a new password for your account.
          </div>
        </div>

        {done ? (
          <div style={{ fontFamily: FONT.grotesque, fontSize: 13, color: SX.ink, textAlign: 'center' }}>
            Password updated. Signing you in…
          </div>
        ) : !ready ? (
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 13,
              color: SX.soft,
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            <p style={{ margin: '0 0 10px' }}>Waiting for a valid reset link…</p>
            <p style={{ margin: 0 }}>
              If nothing happens, your link may have expired.{' '}
              <a href="/login" style={{ color: SX.accent, textDecoration: 'underline' }}>
                Request a new one
              </a>
              .
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Field label="New password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoFocus
                className="sx-input"
                style={inputStyle}
              />
            </Field>

            <Field label="Confirm password">
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                className="sx-input"
                style={inputStyle}
              />
            </Field>

            {error && (
              <Cap color={SX.accent} size={10}>
                {error}
              </Cap>
            )}

            <BtnPrimary type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
              {loading ? 'Updating…' : 'Update password →'}
            </BtnPrimary>
          </form>
        )}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Cap color={SX.soft} size={9.5}>
        {label}
      </Cap>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '12px 14px',
  border: `1px solid ${SX.ink}`,
  background: SX.paper,
  fontFamily: FONT.grotesque,
  fontSize: 14,
  color: SX.ink,
  outline: 'none',
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 0,
}
