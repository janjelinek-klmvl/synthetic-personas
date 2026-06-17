'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { loadHistory } from '@/lib/history'
import { useAudiences } from '@/lib/personas'
import { supabaseBrowser } from '@/lib/supabase'
import { SX, FONT, TNUM, PAGE_W } from '@/lib/design/tokens'
import Logo from '@/components/design/Logo'

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

export default function AppHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const [count, setCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showCompanyPicker, setShowCompanyPicker] = useState(false)
  const [me, setMe] = useState<{
    name: string
    email: string
    isAdmin: boolean
    isBntAdmin: boolean
    companyName: string | null
    impersonating: boolean
  } | null>(null)
  const [companies, setCompanies] = useState<{ id: string; org_name: string; active: boolean }[] | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const { balance } = useAudiences()

  // History badge: count of runs in the last 30 days.
  useEffect(() => {
    const refresh = () => {
      void loadHistory().then((rows) => {
        const cutoff = Date.now() - THIRTY_DAYS_MS
        const recent = rows.filter((r) => {
          const t = r.created_at ? new Date(r.created_at).getTime() : 0
          return t >= cutoff
        })
        setCount(recent.length)
      })
    }
    refresh()
    window.addEventListener('sp-history-updated', refresh)
    return () => {
      window.removeEventListener('sp-history-updated', refresh)
    }
  }, [])

  useEffect(() => {
    fetch('/api/me', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return
        setMe({
          name: d.user?.display_name || d.user?.email?.split('@')[0] || 'You',
          email: d.user?.email ?? '',
          isAdmin: d.role === 'admin',
          isBntAdmin: !!d.is_bnt_admin,
          companyName: d.company?.name ?? null,
          impersonating: !!d.impersonating,
        })
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!showCompanyPicker || companies != null) return
    fetch('/api/companies', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : { companies: [] }))
      .then((d) => setCompanies(d.companies ?? []))
      .catch(() => setCompanies([]))
  }, [showCompanyPicker, companies])

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const onTest = pathname === '/'
  const onPersonas = pathname === '/personas'
  const onHistory = pathname === '/history'
  const onPricing = pathname === '/credits' || pathname === '/pricing'

  async function handleSignOut() {
    const supabase = supabaseBrowser()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const initials = (me?.name ?? 'U')
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header
      style={{
        height: 56,
        background: SX.paper,
        borderBottom: `1px solid ${SX.ink}`,
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      <div
        style={{
          maxWidth: PAGE_W,
          margin: '0 auto',
          padding: '0 48px',
          display: 'flex',
          alignItems: 'center',
          height: '100%',
          gap: 18,
        }}
      >
        <Link href="/" style={{ textDecoration: 'none' }}>
          <Logo />
        </Link>

        <div style={{ flex: 1 }} />

        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <NavLink
            href="/"
            active={onTest}
            onClickWhenActive={() => window.dispatchEvent(new CustomEvent('sp-new-test'))}
          >
            New test
          </NavLink>
          <NavLink href="/personas" active={onPersonas}>
            Personas
          </NavLink>
          <NavLink href="/history" active={onHistory} badge={count > 0 ? count : undefined}>
            History
          </NavLink>
        </nav>

        {/* Credits pill */}
        <Link
          href="/credits"
          title="Credits remaining"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            border: `1px solid ${onPricing ? SX.ink : SX.hair}`,
            background: onPricing ? SX.tint : 'transparent',
            padding: '5px 11px',
            textDecoration: 'none',
            transition: 'border-color 120ms, background 120ms',
          }}
        >
          <span
            style={{
              width: 11,
              height: 11,
              borderRadius: '50%',
              background: `radial-gradient(circle at 30% 30%, ${SX.soft}, ${SX.ink})`,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 12.5,
              fontWeight: 700,
              color: SX.ink,
              ...TNUM,
            }}
          >
            {balance != null ? balance.toLocaleString() : '—'}
          </span>
        </Link>

        {/* Account avatar + menu */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Account"
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: SX.ink,
              color: SX.paper,
              border: 'none',
              cursor: 'pointer',
              fontFamily: FONT.grotesque,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.04em',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {initials || '·'}
          </button>
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: 0,
                background: SX.paper,
                border: `1px solid ${SX.ink}`,
                boxShadow: '0 24px 60px rgba(26,23,20,0.16)',
                minWidth: 260,
                padding: 6,
                zIndex: 100,
              }}
            >
              {me && (
                <div
                  style={{
                    padding: '10px 12px 8px',
                    borderBottom: `1px solid ${SX.hairSoft}`,
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontFamily: FONT.grotesque, fontSize: 13, fontWeight: 700, color: SX.ink }}>
                    {me.name}
                  </div>
                  <div style={{ fontFamily: FONT.grotesque, fontSize: 11, color: SX.soft }}>{me.email}</div>
                  {me.companyName && (
                    <div
                      style={{
                        fontFamily: FONT.grotesque,
                        fontSize: 11,
                        color: SX.accent,
                        fontWeight: 600,
                        marginTop: 4,
                      }}
                    >
                      {me.impersonating ? 'Viewing as ' : ''}
                      {me.companyName}
                    </div>
                  )}
                </div>
              )}

              {me?.isBntAdmin && !showCompanyPicker && (
                <button type="button" onClick={() => setShowCompanyPicker(true)} style={menuItemBaseStyle}>
                  {me.impersonating ? 'Switch company…' : 'View as company…'}
                </button>
              )}

              {me?.isBntAdmin && showCompanyPicker && (
                <div style={{ padding: '4px 8px 8px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '6px 4px 8px',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT.grotesque,
                        fontSize: 10,
                        fontWeight: 700,
                        color: SX.soft,
                        textTransform: 'uppercase',
                        letterSpacing: '0.14em',
                      }}
                    >
                      Companies
                    </span>
                    <button type="button" onClick={() => setShowCompanyPicker(false)} style={tinyLinkStyle}>
                      Back
                    </button>
                  </div>
                  <div
                    style={{
                      maxHeight: 280,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                    }}
                  >
                    {companies == null && (
                      <div style={{ padding: '8px 10px', fontSize: 12, color: SX.soft }}>Loading…</div>
                    )}
                    {companies?.length === 0 && (
                      <div style={{ padding: '8px 10px', fontSize: 12, color: SX.soft }}>No companies.</div>
                    )}
                    {companies?.map((c) => (
                      <a
                        key={c.id}
                        href={`/impersonate?company_id=${encodeURIComponent(c.id)}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '7px 10px',
                          fontFamily: FONT.grotesque,
                          fontSize: 12,
                          color: SX.ink,
                          textDecoration: 'none',
                          transition: 'background 120ms',
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = SX.tint)}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
                      >
                        <span style={{ fontWeight: 600 }}>{c.org_name}</span>
                        {!c.active && <span style={{ fontSize: 10, color: SX.faint }}>inactive</span>}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!showCompanyPicker && (
                <>
                  {!me?.isBntAdmin && (
                    <MenuItem href="/settings/profile" onClick={() => setMenuOpen(false)}>
                      Profile
                    </MenuItem>
                  )}
                  {me?.isAdmin && !me.isBntAdmin && (
                    <MenuItem href="/settings/team" onClick={() => setMenuOpen(false)}>
                      Team
                    </MenuItem>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false)
                      void handleSignOut()
                    }}
                    style={menuItemBaseStyle}
                  >
                    Sign out
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuItem({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} style={{ ...menuItemBaseStyle, textDecoration: 'none' }}>
      {children}
    </Link>
  )
}

const tinyLinkStyle: React.CSSProperties = {
  fontFamily: FONT.grotesque,
  fontSize: 10,
  fontWeight: 700,
  color: SX.soft,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  padding: 0,
  textTransform: 'uppercase',
  letterSpacing: '0.14em',
}

const menuItemBaseStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '8px 12px',
  fontFamily: FONT.grotesque,
  fontSize: 12.5,
  fontWeight: 500,
  color: SX.ink,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  textAlign: 'left',
}

function NavLink({
  href,
  active,
  badge,
  onClickWhenActive,
  children,
}: {
  href: string
  active: boolean
  badge?: number
  onClickWhenActive?: () => void
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="sx-nav"
      onClick={
        active && onClickWhenActive
          ? (e) => {
              e.preventDefault()
              onClickWhenActive()
            }
          : undefined
      }
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 11px',
        fontFamily: FONT.grotesque,
        fontSize: 12.5,
        fontWeight: 700,
        letterSpacing: '0.01em',
        whiteSpace: 'nowrap',
        textDecoration: 'none',
        color: active ? SX.accent : SX.soft,
        transition: 'color 120ms',
      }}
    >
      {children}
      {badge != null && (
        <span
          style={{
            fontFamily: FONT.grotesque,
            fontSize: 9.5,
            fontWeight: 700,
            color: SX.soft,
            background: SX.ghost,
            padding: '1px 6px',
            ...TNUM,
          }}
        >
          {badge}
        </span>
      )}
    </Link>
  )
}
