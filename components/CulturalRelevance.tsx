'use client'

import { useEffect, useState } from 'react'

interface CulturalRelevanceData {
  trendiness:               number
  shareability:             number
  newsworthiness:           number
  recommendationLikelihood: number
}

interface Props {
  culturalRelevance: CulturalRelevanceData
}

const METRICS = [
  {
    key:   'trendiness' as const,
    label: 'Trendiness',
    sublabel: 'On-trend right now',
    color: '#EC4899',
    bg:    '#FDF2F8',
  },
  {
    key:   'shareability' as const,
    label: 'Shareability',
    sublabel: 'Would share with others',
    color: '#06B6D4',
    bg:    '#ECFEFF',
  },
  {
    key:   'newsworthiness' as const,
    label: 'Newsworthy',
    sublabel: 'Buzz & media potential',
    color: '#F59E0B',
    bg:    '#FFFBEB',
  },
  {
    key:   'recommendationLikelihood' as const,
    label: 'Would Recommend',
    sublabel: 'NPS likelihood',
    color: '#10B981',
    bg:    '#ECFDF5',
  },
]

export default function CulturalRelevance({ culturalRelevance }: Props) {
  const [counts, setCounts] = useState({
    trendiness: 0,
    shareability: 0,
    newsworthiness: 0,
    recommendationLikelihood: 0,
  })

  useEffect(() => {
    const duration = 1400
    const startTime = performance.now()
    const targets = {
      trendiness:               culturalRelevance.trendiness               ?? 0,
      shareability:             culturalRelevance.shareability             ?? 0,
      newsworthiness:           culturalRelevance.newsworthiness           ?? 0,
      recommendationLikelihood: culturalRelevance.recommendationLikelihood ?? 0,
    }

    function tick(now: number) {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3)

      setCounts({
        trendiness:               Math.round(targets.trendiness               * ease),
        shareability:             Math.round(targets.shareability             * ease),
        newsworthiness:           Math.round(targets.newsworthiness           * ease),
        recommendationLikelihood: Math.round(targets.recommendationLikelihood * ease),
      })

      if (progress < 1) requestAnimationFrame(tick)
    }

    const timeout = setTimeout(() => requestAnimationFrame(tick), 200)
    return () => clearTimeout(timeout)
  }, [culturalRelevance])

  return (
    <div>
      <div className="label-caps" style={{ color: 'var(--text-tertiary)', marginBottom: '16px' }}>
        Cultural Relevance
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        {METRICS.map(m => {
          const value = counts[m.key]
          const target = culturalRelevance[m.key] ?? 0

          return (
            <div key={m.key} style={{
              background: '#fff',
              borderRadius: '20px',
              padding: '28px 12px 20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              position: 'relative',
              overflow: 'hidden',
            }}>

              {/* Colored top accent bar */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: '4px',
                background: m.color,
                borderRadius: '20px 20px 0 0',
              }} />

              {/* Tinted circle behind number */}
              <div style={{
                position: 'absolute',
                top: '14px',
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: m.bg,
                opacity: 0.7,
              }} />

              {/* Big animated number */}
              <div style={{
                position: 'relative',
                fontSize: '52px',
                fontWeight: 800,
                lineHeight: 1,
                color: m.color,
                letterSpacing: '-0.03em',
                zIndex: 1,
              }}>
                {value}
                <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em' }}>%</span>
              </div>

              {/* Label */}
              <div style={{
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-primary)',
                textAlign: 'center',
                lineHeight: 1.3,
                zIndex: 1,
              }}>
                {m.label}
              </div>

              {/* Sublabel */}
              <div style={{
                fontSize: '10px',
                color: 'var(--text-tertiary)',
                textAlign: 'center',
                lineHeight: 1.3,
                zIndex: 1,
              }}>
                {m.sublabel}
              </div>

              {/* Progress bar */}
              <div style={{
                width: '100%',
                height: '3px',
                background: `${m.color}20`,
                borderRadius: '999px',
                marginTop: '8px',
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${target}%`,
                  background: m.color,
                  borderRadius: '999px',
                  transition: 'width 1.4s cubic-bezier(0.4, 0, 0.2, 1)',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
