'use client'

import { getPersonaById, accentMap } from '@/lib/personas'
import { CombinedTestReport } from '@/lib/types'

interface Props {
  reports: CombinedTestReport[]
  activePersonaId: string
  onSelectPersona: (id: string) => void
}

export default function PersonaComparison({ reports, activePersonaId, onSelectPersona }: Props) {
  const qualColor  = (s: number | null) => s == null ? '#ccc' : s >= 7 ? '#10B981' : s >= 4 ? '#F59E0B' : '#EF4444'
  const quantColor = (s: number | null) => s == null ? '#ccc' : s >= 70 ? '#10B981' : s >= 45 ? '#F59E0B' : '#EF4444'

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${Math.min(reports.length, 6)}, 1fr)`,
      gap: '10px',
      marginBottom: '32px',
      padding: '16px',
      background: '#fff',
      borderRadius: '20px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      {reports.map(r => {
        const persona    = getPersonaById(r.personaId)
        const accent     = accentMap[persona?.accentColor ?? 'indigo'] ?? accentMap.indigo
        const qualScore  = r.qualReport?.overallScore ?? null
        const quantScore = r.quantReport?.compositeScore ?? null
        const isActive   = r.personaId === activePersonaId

        return (
          <button
            key={r.personaId}
            type="button"
            onClick={() => onSelectPersona(r.personaId)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '14px 10px',
              borderRadius: '14px',
              border: isActive ? '1.5px solid #1a1a1a' : '1.5px solid transparent',
              background: isActive ? accent.avatarBg : 'transparent',
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = '#fafafa' }}
            onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px',
              background: accent.avatarBg, color: accent.avatarText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '20px',
            }}>
              {persona?.emoji ?? '?'}
            </div>

            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {persona?.name ?? r.personaId}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: qualColor(qualScore), lineHeight: 1 }}>
                  {qualScore ?? '—'}
                  {qualScore != null && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-tertiary)' }}>/10</span>}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Qual</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: quantColor(quantScore), lineHeight: 1 }}>
                  {quantScore ?? '—'}
                  {quantScore != null && <span style={{ fontSize: '11px', fontWeight: 400, color: 'var(--text-tertiary)' }}>%</span>}
                </div>
                <div style={{ fontSize: '9px', color: 'var(--text-tertiary)', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Quant</div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
