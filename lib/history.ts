import { TestReport } from './types'

export interface HistoryEntry {
  id:         string
  createdAt:  string   // ISO
  personaId:  string
  testTypeId: string
  ideaText:   string
  report:     TestReport
}

const KEY = 'sp-history'

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as HistoryEntry[]) : []
  } catch {
    return []
  }
}

export function saveEntry(data: Omit<HistoryEntry, 'id' | 'createdAt'>): HistoryEntry {
  const entry: HistoryEntry = {
    ...data,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
  const all = loadHistory()
  localStorage.setItem(KEY, JSON.stringify([entry, ...all]))
  // Notify same-tab listeners (e.g. header badge)
  window.dispatchEvent(new CustomEvent('sp-history-updated'))
  return entry
}

export function deleteEntry(id: string): void {
  const all = loadHistory()
  localStorage.setItem(KEY, JSON.stringify(all.filter(e => e.id !== id)))
  window.dispatchEvent(new CustomEvent('sp-history-updated'))
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  const hours = Math.floor(diff / 3_600_000)
  const days  = Math.floor(diff / 86_400_000)
  if (mins  < 1)  return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  < 7)  return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}
