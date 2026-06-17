import type { IdeaType } from './types'
import type { RunRecord } from './store'

// HistoryEntry is now a thin alias for RunRecord — history is the server-side
// list of runs persisted by /api/runs.
export type HistoryEntry = RunRecord
export type { RunRecord }

export async function loadHistory(): Promise<HistoryEntry[]> {
  try {
    const res = await fetch('/api/runs', { cache: 'no-store' })
    if (!res.ok) return []
    const body = await res.json()
    return Array.isArray(body.runs) ? body.runs : []
  } catch {
    return []
  }
}

export async function deleteEntry(id: string): Promise<void> {
  try {
    await fetch(`/api/runs/${id}`, { method: 'DELETE' })
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sp-history-updated'))
    }
  } catch {
    /* swallow — UI will re-fetch and show the stale entry as a no-op */
  }
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

export function ideaTypeLabel(ideaType: IdeaType): string {
  switch (ideaType) {
    case 'insight':     return 'Insight'
    case 'proposition': return 'Proposition'
    case 'campaign':    return 'Campaign'
  }
}

// Aggregate the per-audience succeeded results' first quant score (if any)
// into a single display number, for the history list.
export function getDisplayScore(entry: HistoryEntry): { value: number | null; max: number } {
  const succeeded = Object.values(entry.per_audience).filter((s) => s.status === 'succeeded' && s.result)
  if (succeeded.length === 0) return { value: null, max: 10 }
  const allScores: number[] = []
  for (const s of succeeded) {
    const scores = Object.values(s.result?.audience_quant_results ?? {}).map((r) => r.score)
    for (const n of scores) if (typeof n === 'number') allScores.push(n)
  }
  if (allScores.length === 0) return { value: null, max: 10 }
  return { value: Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length), max: 10 }
}
