import { NextRequest, NextResponse } from 'next/server'
import { extractIdea } from '@/lib/extractIdea'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'
import { checkRateLimit } from '@/lib/rate-limit'
import type { ExtractIdeaRequest, ExtractOutcome } from '@/lib/types'

// Allow up to 15 MB JSON bodies (PDFs base64-encoded ~33% bigger than raw).
export const dynamic = 'force-dynamic'
export const maxDuration = 60

// POST /api/extract-idea
//
// Body (JSON): ExtractIdeaRequest { filename, source: { kind: 'text'|'document'|'image', ... }, ... }
//
// Always returns 200 with an ExtractOutcome. Errors that prevent extraction
// surface as { kind: 'no_idea_found', reason }. Auth failures still use
// 401/403 since they're orthogonal.
export async function POST(request: NextRequest) {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }

  const rl = await checkRateLimit('sp-extract', ctx.companyId, 20, 60)
  if (!rl.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', retry_after_seconds: rl.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } },
    )
  }

  // Reject oversized payloads up front (base64 files). Vercel serverless also
  // caps request bodies at ~4.5MB, so keep this at or below that.
  const MAX_REQUEST_BYTES = 4_000_000
  const contentLength = Number(request.headers.get('content-length') ?? 0)
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json<ExtractOutcome>(
      { kind: 'no_idea_found', reason: 'FILE_TOO_LARGE' },
      { status: 413 },
    )
  }

  const body = (await request.json().catch(() => null)) as ExtractIdeaRequest | null
  if (!body?.source || !body.filename) {
    return NextResponse.json<ExtractOutcome>(
      { kind: 'no_idea_found', reason: 'NO_SOURCE' },
      { status: 200 },
    )
  }

  const outcome = await extractIdea({
    filename: body.filename,
    source: body.source,
    pick: body.pick,
    clarifications: body.clarifications,
    prior: body.prior,
  })
  return NextResponse.json<ExtractOutcome>(outcome)
}
