import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, supabaseServer } from '@/lib/supabase-server'

interface CompanyInviteRow {
  id: string
  company_id: string
  email: string
  role: 'admin' | 'member'
  token: string
  expires_at: string
  accepted_at: string | null
}

interface BntInviteRow {
  id: string
  email: string
  token: string
  expires_at: string
  accepted_at: string | null
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  // Identify the user from the session — must be signed in at this point.
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const displayName: string | null =
    typeof body?.display_name === 'string' && body.display_name.trim().length > 0
      ? body.display_name.trim()
      : null

  // Try company invite first.
  const { data: companyInvite } = await supabaseAdmin
    .from('invitations')
    .select('id, company_id, email, role, token, expires_at, accepted_at')
    .eq('token', params.token)
    .maybeSingle<CompanyInviteRow>()

  if (companyInvite) {
    return acceptCompanyInvite(user.id, user.email ?? '', companyInvite, displayName)
  }

  // Otherwise BNT-admin invite.
  const { data: bntInvite } = await supabaseAdmin
    .from('bnt_admin_invitations')
    .select('id, email, token, expires_at, accepted_at')
    .eq('token', params.token)
    .maybeSingle<BntInviteRow>()

  if (bntInvite) {
    return acceptBntInvite(user.id, user.email ?? '', bntInvite, displayName)
  }

  return NextResponse.json({ error: 'INVITE_NOT_FOUND' }, { status: 404 })
}

async function acceptCompanyInvite(
  userId: string,
  userEmail: string,
  invite: CompanyInviteRow,
  displayName: string | null,
) {
  if (invite.accepted_at)
    return NextResponse.json({ error: 'INVITE_ALREADY_ACCEPTED' }, { status: 409 })
  if (new Date(invite.expires_at).getTime() < Date.now())
    return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 410 })
  if (userEmail.toLowerCase() !== invite.email.toLowerCase())
    return NextResponse.json({ error: 'EMAIL_MISMATCH' }, { status: 403 })

  const { data: existing } = await supabaseAdmin
    .from('profiles')
    .select('id, company_id')
    .eq('id', userId)
    .maybeSingle<{ id: string; company_id: string }>()

  if (existing && existing.company_id !== invite.company_id) {
    return NextResponse.json({ error: 'ALREADY_IN_OTHER_COMPANY' }, { status: 409 })
  }

  if (!existing) {
    const { error: insertErr } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      company_id: invite.company_id,
      role: invite.role,
      display_name: displayName,
    })
    if (insertErr) {
      console.error('accept-invite (company): insert profile failed:', insertErr)
      return NextResponse.json({ error: 'INTERNAL', detail: insertErr.message }, { status: 500 })
    }
  } else if (displayName) {
    await supabaseAdmin.from('profiles').update({ display_name: displayName }).eq('id', userId)
  }

  await supabaseAdmin
    .from('invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ ok: true, kind: 'company' })
}

async function acceptBntInvite(
  userId: string,
  userEmail: string,
  invite: BntInviteRow,
  displayName: string | null,
) {
  if (invite.accepted_at)
    return NextResponse.json({ error: 'INVITE_ALREADY_ACCEPTED' }, { status: 409 })
  if (new Date(invite.expires_at).getTime() < Date.now())
    return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 410 })
  if (userEmail.toLowerCase() !== invite.email.toLowerCase())
    return NextResponse.json({ error: 'EMAIL_MISMATCH' }, { status: 403 })

  // Upsert the bnt_admins row.
  const { error: upsertErr } = await supabaseAdmin
    .from('bnt_admins')
    .upsert({ user_id: userId, display_name: displayName }, { onConflict: 'user_id' })
  if (upsertErr) {
    console.error('accept-invite (bnt): upsert bnt_admins failed:', upsertErr)
    return NextResponse.json({ error: 'INTERNAL', detail: upsertErr.message }, { status: 500 })
  }

  await supabaseAdmin
    .from('bnt_admin_invitations')
    .update({ accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return NextResponse.json({ ok: true, kind: 'bnt' })
}
