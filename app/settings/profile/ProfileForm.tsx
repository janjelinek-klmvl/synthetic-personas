'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase'
import { SX, FONT } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'
import { BtnPrimary, BtnGhost } from '@/components/design/Btn'

interface Props {
  email: string
  initialDisplayName: string
}

function getInitials(name: string, email: string): string {
  const source = name?.trim() || email.split('@')[0]
  return source
    .split(/[\s-_.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

export default function ProfileForm({ email, initialDisplayName }: Props) {
  const router = useRouter()
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [password, setPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null)

  const initials = getInitials(displayName, email)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setMessage(null)
    setSaving(true)
    const supabase = supabaseBrowser()

    if (displayName.trim() !== initialDisplayName) {
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData?.user?.id
      if (userId) {
        const { error } = await supabase
          .from('profiles')
          .update({ display_name: displayName.trim() })
          .eq('id', userId)
        if (error) {
          setMessage({ tone: 'err', text: error.message })
          setSaving(false)
          return
        }
      }
    }

    if (password.length > 0) {
      if (password.length < 8) {
        setMessage({ tone: 'err', text: 'Password must be at least 8 characters.' })
        setSaving(false)
        return
      }
      const { error } = await supabase.auth.updateUser({ password })
      if (error) {
        setMessage({ tone: 'err', text: error.message })
        setSaving(false)
        return
      }
      setPassword('')
    }

    setMessage({ tone: 'ok', text: 'Saved.' })
    setSaving(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Avatar header — initials only, no upload */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: SX.ink,
            color: SX.paper,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: FONT.grotesque,
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '0.04em',
          }}
          aria-hidden
        >
          {initials || '·'}
        </div>
        <div>
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 18,
              fontWeight: 800,
              color: SX.ink,
              letterSpacing: '-0.015em',
            }}
          >
            {displayName || email.split('@')[0]}
          </div>
          <div
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 12,
              color: SX.soft,
              marginTop: 4,
            }}
          >
            {email}
          </div>
        </div>
      </div>

      <Cap color={SX.soft} size={10}>
        Personal details
      </Cap>

      {/* 2-column field grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 16,
        }}
      >
        <Field label="Email" disabled>
          <input value={email} disabled style={{ ...inputStyle, background: SX.tint, color: SX.faint }} />
        </Field>

        <Field label="Display name">
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            required
            className="sx-input"
            style={inputStyle}
          />
        </Field>

        <Field label="Change password">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep current"
            minLength={password.length > 0 ? 8 : undefined}
            className="sx-input"
            style={inputStyle}
          />
        </Field>
      </div>

      {message && (
        <div
          style={{
            padding: '10px 14px',
            border: `1px solid ${message.tone === 'ok' ? SX.ok : SX.accent}`,
            background: message.tone === 'ok' ? 'rgba(28,140,91,0.08)' : SX.accentGhost,
            color: message.tone === 'ok' ? SX.ok : SX.accent,
            fontFamily: FONT.grotesque,
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {message.text}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: 12,
          marginTop: 4,
        }}
      >
        <BtnGhost type="button" onClick={() => router.refresh()}>
          Cancel
        </BtnGhost>
        <BtnPrimary type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </BtnPrimary>
      </div>
    </form>
  )
}

function Field({ label, children, disabled }: { label: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Cap color={disabled ? SX.faint : SX.soft} size={9.5}>
        {label}
      </Cap>
      {children}
    </label>
  )
}

const inputStyle: React.CSSProperties = {
  padding: '11px 14px',
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
