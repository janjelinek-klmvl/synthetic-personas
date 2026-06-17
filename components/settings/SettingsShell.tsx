'use client'

import Link from 'next/link'
import { ReactNode } from 'react'
import AppHeader from '@/components/AppHeader'
import { SX, FONT, PAGE_W } from '@/lib/design/tokens'
import Cap from '@/components/design/Cap'

interface Props {
  active: 'profile' | 'team'
  isAdmin: boolean
  companyName?: string | null
  role?: string | null
  title: string
  subtitle?: string
  children: ReactNode
}

// Settings shell — left rail (Profile / Team) + content.
// Billing and API access are deliberately hidden (no backend yet).
export default function SettingsShell({ active, isAdmin, companyName, role, title, subtitle, children }: Props) {
  return (
    <div className="min-h-screen" style={{ background: SX.paper }}>
      <AppHeader />

      <div style={{ maxWidth: PAGE_W, margin: '0 auto', padding: '48px 48px 96px' }}>
        <div style={{ borderTop: `2px solid ${SX.accent}`, paddingTop: 14, marginBottom: 32 }}>
          <Cap color={SX.accent} size={11}>
            Settings
          </Cap>
          <h1
            style={{
              margin: '12px 0 8px',
              fontFamily: FONT.grotesque,
              fontSize: 34,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: SX.ink,
              lineHeight: 1,
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              style={{
                margin: 0,
                fontFamily: FONT.grotesque,
                fontSize: 13.5,
                color: SX.soft,
              }}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr',
            gap: 48,
            alignItems: 'start',
          }}
        >
          {/* Left rail */}
          <nav style={{ display: 'flex', flexDirection: 'column' }}>
            <RailItem href="/settings/profile" active={active === 'profile'} label="Profile" />
            {isAdmin && (
              <RailItem href="/settings/team" active={active === 'team'} label="Team" />
            )}
            {/* Billing + API access intentionally hidden (no backend) */}
          </nav>

          {/* Content */}
          <div style={{ minWidth: 0 }}>
            {(companyName || role) && (
              <Cap color={SX.faint} size={9.5} style={{ marginBottom: 20 }}>
                {companyName} {role && `· ${role}`}
              </Cap>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

function RailItem({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: 'block',
        padding: '12px 14px',
        borderLeft: `3px solid ${active ? SX.accent : 'transparent'}`,
        background: active ? SX.tint : 'transparent',
        fontFamily: FONT.grotesque,
        fontSize: 13,
        fontWeight: active ? 700 : 500,
        color: active ? SX.ink : SX.soft,
        textDecoration: 'none',
        transition: 'background 120ms, color 120ms',
        letterSpacing: '-0.005em',
      }}
    >
      {label}
    </Link>
  )
}
