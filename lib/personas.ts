// Audience Studio is the source of truth for audiences now. This module is
// the small client-side adapter: a context provider that fetches /api/audiences
// once, plus deterministic helpers that turn an AudienceSummary into the
// "card" shape the UI was built around (emoji + accent color).
//
// Server code should import from '@/lib/audienceStudio' directly instead of
// going through here.

'use client'

import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type {
  AudienceListResponse,
  AudienceSummary,
  PricingInfo,
  QualModuleMeta,
  QuantMetricMeta,
} from './types-as'

export const accentMap: Record<string, { avatarBg: string; avatarText: string }> = {
  amber:  { avatarBg: '#FFF3D6', avatarText: '#8A6200' },
  violet: { avatarBg: '#E8DEFF', avatarText: '#6B3ECC' },
  cyan:   { avatarBg: '#D6E4FD', avatarText: '#2E63E0' },
  green:  { avatarBg: '#D4EDD4', avatarText: '#2A6A2A' },
  indigo: { avatarBg: '#D9DCFF', avatarText: '#3D52C4' },
  rose:   { avatarBg: '#FFD6E0', avatarText: '#C4335A' },
}

const ACCENT_KEYS = Object.keys(accentMap)
const EMOJIS = ['🎯', '🧭', '🔭', '🌱', '⚙️', '🪄', '🧪', '🪐', '🎨', '🛠️', '📚', '🎬']

function hashString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export function pickAccent(id: string): string {
  return ACCENT_KEYS[hashString(id) % ACCENT_KEYS.length]
}

export function pickEmoji(id: string): string {
  return EMOJIS[hashString(id) % EMOJIS.length]
}

// "Persona" is what the UI used to call the testable unit. Now it's an
// audience surfaced from Audience Studio plus a couple of synthesized display
// fields. The type alias keeps existing component code readable.
export interface AudienceCard {
  id: string
  name: string
  tagline: string
  emoji: string
  accentColor: string
  shortDefinition: string | null
  coreTension: string | null
  personaCount: number
}

export function audienceToCard(a: AudienceSummary): AudienceCard {
  return {
    id: a.id,
    name: a.name,
    tagline: a.short_definition ?? a.core_tension ?? '',
    emoji: pickEmoji(a.id),
    accentColor: pickAccent(a.id),
    shortDefinition: a.short_definition,
    coreTension: a.core_tension,
    personaCount: a.persona_count,
  }
}

// ── Audiences Context ────────────────────────────────────────────────

interface AudiencesContextValue {
  audiences: AudienceCard[]
  quantMetrics: QuantMetricMeta[]
  qualModules: QualModuleMeta[]
  pricing: PricingInfo | null
  balance: number | null
  byId: (id: string) => AudienceCard | undefined
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

const AudiencesContext = createContext<AudiencesContextValue | null>(null)

export function AudiencesProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AudienceListResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const inflight = useRef<Promise<void> | null>(null)

  const load = useCallback(async () => {
    if (inflight.current) return inflight.current
    const p = (async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/audiences', { cache: 'no-store' })
        const body = await res.json()
        if (!res.ok) throw new Error(body?.error ?? `HTTP ${res.status}`)
        setData(body as AudienceListResponse)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
        inflight.current = null
      }
    })()
    inflight.current = p
    return p
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const value = useMemo<AudiencesContextValue>(() => {
    const audiences = (data?.audiences ?? []).map(audienceToCard)
    const byId = (id: string) => audiences.find((a) => a.id === id)
    return {
      audiences,
      quantMetrics: data?.quant_metrics ?? [],
      qualModules: data?.qual_modules ?? [],
      pricing: data?.pricing ?? null,
      balance: data?.balance ?? null,
      byId,
      loading,
      error,
      refresh: load,
    }
  }, [data, loading, error, load])

  return createElement(AudiencesContext.Provider, { value }, children)
}

export function useAudiences(): AudiencesContextValue {
  const ctx = useContext(AudiencesContext)
  if (!ctx) {
    throw new Error('useAudiences must be used inside <AudiencesProvider>')
  }
  return ctx
}
