'use client'

export default function AppFooter() {
  const year = new Date().getFullYear()

  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      background: 'var(--surface)',
    }}>
      <div className="container-xl" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '20px',
        paddingBottom: '20px',
        gap: '16px',
        flexWrap: 'wrap',
      }}>

        {/* Left — brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Synthetic<span style={{ color: 'var(--primary)' }}>.</span>
          </span>
          <span style={{ width: '1px', height: '12px', background: 'var(--border-subtle)', display: 'inline-block' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>
            © {year} B&amp;T Lab. All rights reserved.
          </span>
        </div>

        {/* Right — links + note */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
{[
            { label: 'Privacy', href: '#' },
            { label: 'Terms',   href: '#' },
          ].map(link => (
            <a
              key={link.label}
              href={link.href}
              style={{
                fontSize: '12px',
                color: 'var(--text-disabled)',
                textDecoration: 'none',
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-disabled)')}
            >
              {link.label}
            </a>
          ))}
        </div>

      </div>
    </footer>
  )
}
