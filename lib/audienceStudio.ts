// Thin server-side client over the Audience Studio v1 API.
// Server-only — never import from a client component.
//
// Calls authenticate as the *current user's company* via its api_clients row.
// A small fallback (env AUDIENCE_STUDIO_API_KEY) exists for paths that run
// before a session is established (e.g. boot-time health checks).

import type {
  AudienceListResponse,
  ChatRunInput,
  ChatRunResponse,
  RunStatusResponse,
  StartRunInput,
  StartRunResponse,
} from './types-as'

function asBaseUrl(): string {
  const base = process.env.AUDIENCE_STUDIO_URL
  if (!base) throw new Error('AUDIENCE_STUDIO_URL must be set in .env.local')
  return base.replace(/\/+$/, '')
}

function envFallbackKey(): string | undefined {
  const k = process.env.AUDIENCE_STUDIO_API_KEY
  return k && k.length > 0 ? k : undefined
}

async function asFetch<T>(apiKey: string, path: string, init?: RequestInit): Promise<T> {
  const base = asBaseUrl()
  const res = await fetch(`${base}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  })
  const text = await res.text()
  let body: unknown
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = { error: 'INVALID_RESPONSE', detail: text.slice(0, 500) }
  }
  if (!res.ok) {
    const err = body as { error?: string; detail?: unknown } | null
    const message = err?.error ?? `HTTP ${res.status}`
    const e = new Error(message) as Error & { status?: number; detail?: unknown }
    e.status = res.status
    e.detail = err?.detail
    throw e
  }
  return body as T
}

// ── Per-company calls (use the current user's company key) ──────────

export function listAudiences(apiKey: string): Promise<AudienceListResponse> {
  return asFetch<AudienceListResponse>(apiKey, '/api/v1/audiences', { method: 'GET' })
}

export function startRun(apiKey: string, input: StartRunInput): Promise<StartRunResponse> {
  return asFetch<StartRunResponse>(apiKey, '/api/v1/runs', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function getRun(apiKey: string, runId: string): Promise<RunStatusResponse> {
  return asFetch<RunStatusResponse>(
    apiKey,
    `/api/v1/runs/${encodeURIComponent(runId)}`,
    { method: 'GET' },
  )
}

/**
 * Chat with a completed AS run. `runId` is the AS-side run id (one per
 * audience). For multi-audience SP runs, SP picks which AS run to chat with.
 */
export function chatRun(apiKey: string, runId: string, input: ChatRunInput): Promise<ChatRunResponse> {
  return asFetch<ChatRunResponse>(
    apiKey,
    `/api/v1/runs/${encodeURIComponent(runId)}/chat`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  )
}

// ── Fallback for paths that may run pre-auth ────────────────────────

export function envFallbackOrThrow(): string {
  const k = envFallbackKey()
  if (!k) throw new Error('AUDIENCE_STUDIO_API_KEY not set and no session available')
  return k
}
