'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { loadHistory } from '@/lib/history'
import { CREDITS_BALANCE } from '@/lib/credits'

export default function AppHeader() {
  const pathname = usePathname()
  const [count, setCount] = useState(0)

  useEffect(() => {
    setCount(loadHistory().length)
    const refresh = () => setCount(loadHistory().length)
    window.addEventListener('sp-history-updated', refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener('sp-history-updated', refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const onTest     = pathname === '/'
  const onPersonas = pathname === '/personas'
  const onHistory  = pathname === '/history'
  const onPricing  = pathname === '/pricing'

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      background: 'var(--surface)',
      position: 'sticky', top: 0, zIndex: 30,
    }}>
      <div className="container-xl py-5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Synthetic<span style={{ color: 'var(--primary)' }}>.</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

          <NavLink href="/" active={onTest} onClickWhenActive={() => window.dispatchEvent(new CustomEvent('sp-new-test'))}>New test</NavLink>
          <NavLink href="/personas" active={onPersonas}>Personas</NavLink>
          <NavLink href="/history" active={onHistory} badge={count > 0 ? count : undefined}>
            History
          </NavLink>

          {/* Credits */}
          <Link href="/pricing" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px 5px 10px',
            marginLeft: '8px',
            borderRadius: '999px',
            border: `1px solid ${onPricing ? 'var(--primary)' : 'var(--border-subtle)'}`,
            background: onPricing ? 'var(--primary-light)' : '#fff',
            textDecoration: 'none',
            transition: 'all 0.15s',
            cursor: 'pointer',
          }}>
            <span style={{ fontSize: '14px', lineHeight: 1 }}>🪙</span>
            <span style={{
              fontSize: '13px', fontWeight: 700,
              color: onPricing ? 'var(--primary)' : 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>
              {CREDITS_BALANCE.toLocaleString()}
            </span>
          </Link>

        </nav>
      </div>
    </header>
  )
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
    <Link href={href} onClick={active && onClickWhenActive ? (e) => { e.preventDefault(); onClickWhenActive() } : undefined} style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: '6px 14px', borderRadius: '999px',
      fontSize: '13px', fontWeight: 600,
      textDecoration: 'none', letterSpacing: '-0.01em',
      background: active ? 'var(--primary-light)' : 'transparent',
      color: active ? 'var(--primary)' : 'var(--text-secondary)',
      transition: 'all 0.15s',
    }}>
      {children}
      {badge != null && (
        <span style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          minWidth: '18px', height: '18px', padding: '0 5px',
          borderRadius: '999px',
          fontSize: '10px', fontWeight: 700,
          background: active ? 'var(--primary)' : 'var(--border)',
          color: active ? '#fff' : 'var(--text-secondary)',
          transition: 'all 0.15s',
        }}>
          {badge}
        </span>
      )}
    </Link>
  )
}
