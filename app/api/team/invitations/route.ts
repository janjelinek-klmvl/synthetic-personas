import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'

function makeToken(): string {
  return randomBytes(24).toString('base64url')
}

// /accept-invite lives in this app, so the origin the admin is using is the
// right base: it stays correct on preview deployments and custom domains.
// NEXT_PUBLIC_SP_BASE_URL still wins when set, for the canonical domain.
function inviteUrl(token: string, request: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_SP_BASE_URL?.trim()
  const base = configured || requestOrigin(request)
  return `${base.replace(/\/+$/, '')}/accept-invite/${token}`
}

function requestOrigin(request: NextRequest): string {
  const host = request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  if (!host) return new URL(request.url).origin
  const proto = request.headers.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

async function requireAdmin() {
  const ctx = await getCurrentCompany()
  if (ctx.role !== 'admin') {
    return { ctx: null as never, error: NextResponse.json({ error: 'ADMIN_ONLY' }, { status: 403 }) }
  }
  return { ctx, error: null }
}

function handleAuthError(e: unknown) {
  if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
  if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
  return null
}

export async function GET(request: NextRequest) {
  try {
    const { ctx, error } = await requireAdmin()
    if (error) return error
    const { data } = await supabaseAdmin
      .from('invitations')
      .select('id, email, role, token, expires_at, accepted_at, created_at')
      .eq('company_id', ctx.companyId)
      .order('created_at', { ascending: false })
    const rows = (data ?? []).map((r) => ({ ...r, url: inviteUrl(r.token, request) }))
    return NextResponse.json({ invitations: rows })
  } catch (e) {
    const err = handleAuthError(e)
    if (err) return err
    throw e
  }
}

export async function POST(request: NextRequest) {
  try {
    const { ctx, error } = await requireAdmin()
    if (error) return error

    const body = await request.json().catch(() => null) as { email?: string; role?: 'admin' | 'member' } | null
    const email = (body?.email ?? '').trim().toLowerCase()
    const role = body?.role === 'admin' ? 'admin' : 'member'
    if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      return NextResponse.json({ error: 'INVALID_EMAIL' }, { status: 400 })
    }

    const token = makeToken()
    const { data, error: insertErr } = await supabaseAdmin
      .from('invitations')
      .insert({
        company_id: ctx.companyId,
        email,
        role,
        token,
        invited_by: ctx.userId,
      })
      .select('id, email, role, token, expires_at, accepted_at, created_at')
      .single()
    if (insertErr || !data) {
      return NextResponse.json({ error: 'INTERNAL', detail: insertErr?.message }, { status: 500 })
    }

    return NextResponse.json(
      { invitation: { ...data, url: inviteUrl(data.token, request) } },
      { status: 201 },
    )
  } catch (e) {
    const err = handleAuthError(e)
    if (err) return err
    throw e
  }
}
