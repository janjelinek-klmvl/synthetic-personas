'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { loadHistory } from '@/lib/history'

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

  const onHistory = pathname === '/history'
  const onTest    = pathname === '/'

  return (
    <header style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface)', position: 'sticky', top: 0, zIndex: 30 }}>
      <div className="max-w-2xl mx-auto px-6 py-5 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <span style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Synthetic<span style={{ color: 'var(--primary)' }}>.</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: 'flex', gap: '4px' }}>

          <Link href="/" style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '6px 14px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', letterSpacing: '-0.01em',
            background: onTest ? 'var(--primary-light)' : 'transparent',
            color: onTest ? 'var(--primary)' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            Test
          </Link>

          <Link href="/history" style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '6px 14px', borderRadius: '999px',
            fontSize: '13px', fontWeight: 600,
            textDecoration: 'none', letterSpacing: '-0.01em',
            background: onHistory ? 'var(--primary-light)' : 'transparent',
            color: onHistory ? 'var(--primary)' : 'var(--text-secondary)',
            transition: 'all 0.15s',
          }}>
            History
            {count > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: '18px', height: '18px', padding: '0 5px',
                borderRadius: '999px',
                fontSize: '10px', fontWeight: 700,
                background: onHistory ? 'var(--primary)' : 'var(--border)',
                color: onHistory ? '#fff' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
                {count}
              </span>
            )}
          </Link>

        </nav>
      </div>
    </header>
  )
}
