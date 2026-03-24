import { CombinedTestReport, IdeaType, HistoryEntry } from './types'

export type { HistoryEntry }

const KEY = 'sp-history'

function normalizeEntry(e: unknown): HistoryEntry {
  const entry = e as Record<string, unknown>
  // Migrate legacy single-persona entries
  if ('personaId' in entry && !('personaIds' in entry)) {
    entry.personaIds = [entry.personaId]
    delete entry.personaId
  }
  if ('report' in entry && !('reports' in entry)) {
    entry.reports = [entry.report]
    delete entry.report
  }
  return entry as unknown as HistoryEntry
}

export function loadHistory(): HistoryEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as unknown[]) : []
    return parsed.map(normalizeEntry)
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

// Helper: get display score from a single combined report (uses qual score as primary)
export function getDisplayScore(report: CombinedTestReport): { value: number | null; max: number } {
  if (report.qualReport?.overallScore != null) {
    return { value: report.qualReport.overallScore, max: 10 }
  }
  if (report.quantReport?.compositeScore != null) {
    return { value: report.quantReport.compositeScore, max: 100 }
  }
  return { value: null, max: 10 }
}

// Helper: get average display score across multiple reports
export function getDisplayScoreMulti(reports: CombinedTestReport[]): { value: number | null; max: number } {
  if (reports.length === 0) return { value: null, max: 10 }
  if (reports.length === 1) return getDisplayScore(reports[0])
  const qualScores = reports.map(r => r.qualReport?.overallScore).filter((s): s is number => s != null)
  if (qualScores.length > 0) {
    return { value: Math.round(qualScores.reduce((a, b) => a + b, 0) / qualScores.length), max: 10 }
  }
  const quantScores = reports.map(r => r.quantReport?.compositeScore).filter((s): s is number => s != null)
  if (quantScores.length > 0) {
    return { value: Math.round(quantScores.reduce((a, b) => a + b, 0) / quantScores.length), max: 100 }
  }
  return { value: null, max: 10 }
}

export function ideaTypeLabel(ideaType: IdeaType): string {
  switch (ideaType) {
    case 'proposition': return 'Proposition'
    case 'campaign':    return 'Campaign'
  }
}
