'use client'

import { SX, FONT, PAGE_W } from '@/lib/design/tokens'

export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      style={{
        borderTop: `1px solid ${SX.hairSoft}`,
        background: SX.paper,
      }}
    >
      <div
        style={{
          maxWidth: PAGE_W,
          margin: '0 auto',
          padding: '20px 48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 13,
              fontWeight: 800,
              color: SX.ink,
              letterSpacing: '-0.02em',
            }}
          >
            Synthetic<span style={{ color: SX.accent }}>.</span>
          </span>
          <span
            style={{
              width: 1,
              height: 12,
              background: SX.hairSoft,
              display: 'inline-block',
            }}
          />
          <span
            style={{
              fontFamily: FONT.grotesque,
              fontSize: 10,
              color: SX.faint,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
            }}
          >
            © {year} B&amp;T Lab
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {[
            { label: 'Privacy', href: '#' },
            { label: 'Terms', href: '#' },
          ].map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="sx-link"
              style={{
                fontFamily: FONT.grotesque,
                fontSize: 10,
                fontWeight: 700,
                color: SX.faint,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                textDecoration: 'none',
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
