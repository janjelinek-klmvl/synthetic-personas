'use client'

import { useEffect, useRef, useState } from 'react'
import type { RunRecord } from './store'

interface PollingState {
  record: RunRecord | null
  error: string | null
  polling: boolean
}

const POLL_INTERVAL_MS = 3000

// Polls /api/runs/<runId> until status is terminal (succeeded | failed | partial).
// Pass null to stop / not start.
export function usePollingRun(runId: string | null): PollingState {
  const [record, setRecord] = useState<RunRecord | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [polling, setPolling] = useState(false)
  const cancelled = useRef(false)

  useEffect(() => {
    cancelled.current = false
    if (!runId) {
      setRecord(null)
      setError(null)
      setPolling(false)
      return
    }
    setPolling(true)
    setError(null)

    let timer: ReturnType<typeof setTimeout> | null = null

    async function tick() {
      try {
        const res = await fetch(`/api/runs/${runId}`, { cache: 'no-store' })
        const body = await res.json()
        if (cancelled.current) return
        if (!res.ok) {
          setError(body?.error ?? `HTTP ${res.status}`)
          setPolling(false)
          return
        }
        const next: RunRecord = body.record
        setRecord(next)
        if (next.overall_status === 'running') {
          timer = setTimeout(tick, POLL_INTERVAL_MS)
        } else {
          setPolling(false)
        }
      } catch (err) {
        if (cancelled.current) return
        setError(err instanceof Error ? err.message : String(err))
        setPolling(false)
      }
    }

    void tick()

    return () => {
      cancelled.current = true
      if (timer) clearTimeout(timer)
    }
  }, [runId])

  return { record, error, polling }
}
