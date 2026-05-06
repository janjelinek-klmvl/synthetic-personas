'use client'

import { useEffect, useState } from 'react'

const MESSAGES = [
  'Reading your idea…',
  'Extracting key assumptions…',
  'Identifying your audience…',
  'Crafting your questions…',
]

export default function BriefLoadingState() {
  const [msgIndex, setMsgIndex] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIndex(i => (i + 1) % MESSAGES.length)
        setVisible(true)
      }, 200)
    }, 1400)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        @keyframes scanLine {
          0%   { transform: translateY(0px);   opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(40px);  opacity: 0; }
        }
        @keyframes briefFade {
          from { opacity: 0; transform: translateY(4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.45; }
        }
      `}</style>

      {/* Icon + message */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>

        {/* Document scanner icon */}
        <div style={{ position: 'relative', width: '36px', height: '44px', flexShrink: 0 }}>
          <svg width="36" height="44" viewBox="0 0 36 44" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Document body */}
            <rect x="2" y="2" width="32" height="40" rx="4" fill="#f5f5f5" stroke="#e0e0e0" strokeWidth="1.5" />
            {/* Text lines */}
            <rect x="8" y="12" width="20" height="2.5" rx="1.25" fill="#d0d0d0" />
            <rect x="8" y="19" width="16" height="2.5" rx="1.25" fill="#d0d0d0" />
            <rect x="8" y="26" width="20" height="2.5" rx="1.25" fill="#d0d0d0" />
            <rect x="8" y="33" width="12" height="2.5" rx="1.25" fill="#d0d0d0" />
            {/* Scanning highlight bar */}
            <rect
              x="2" y="10" width="32" height="6" rx="2"
              fill="url(#scanGrad)"
              style={{ animation: 'scanLine 1.6s ease-in-out infinite' }}
            />
            <defs>
              <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor="#1a1a1a" stopOpacity="0" />
                <stop offset="40%"  stopColor="#1a1a1a" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#1a1a1a" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Cycling text */}
        <div style={{ minHeight: '24px', display: 'flex', alignItems: 'center' }}>
          <span
            key={msgIndex}
            style={{
              fontSize: '15px',
              color: '#555',
              fontWeight: 450,
              animation: visible ? 'briefFade 0.25s ease-out forwards' : 'none',
              opacity: visible ? undefined : 0,
            }}
          >
            {MESSAGES[msgIndex]}
          </span>
        </div>
      </div>

      {/* Skeleton placeholders mimicking question UI */}
      <div style={{ height: '3px', background: '#f0f0f0', borderRadius: '9999px' }} />
      <div style={{ height: '22px', background: '#f0f0f0', borderRadius: '8px', width: '65%', animation: 'pulse 1.6s ease-in-out infinite' }} />
      <div style={{ height: '52px', background: '#f0f0f0', borderRadius: '12px', animation: 'pulse 1.6s ease-in-out infinite 0.3s' }} />
    </div>
  )
}
