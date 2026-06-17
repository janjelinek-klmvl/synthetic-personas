'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase'
import { SX, FONT } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import Logo from '@/components/design/Logo'
import { BtnPrimary } from '@/components/design/Btn'

function LoginInner() {
  const router = useRouter()
  const search = useSearchParams()
  const reason = search.get('reason')
  const next = search.get('next') ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = supabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    router.push(next)
    router.refresh()
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
            Sign in
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
            Test ideas against synthetic audiences.
          </div>
        </div>

        {reason === 'no_profile' && (
          <div
            style={{
              marginBottom: 18,
              padding: '12px 14px',
              border: `1px solid ${SX.warn}`,
              background: 'rgba(176,122,18,0.10)',
              color: SX.warn,
              fontFamily: FONT.grotesque,
              fontSize: 12,
              lineHeight: 1.5,
            }}
          >
            Your account exists but isn&apos;t linked to a company yet. Ask your admin for an invite.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
              className="sx-input"
              style={inputStyle}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {loading ? 'Signing in…' : 'Sign in →'}
          </BtnPrimary>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
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
