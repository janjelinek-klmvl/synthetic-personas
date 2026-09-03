import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-server'

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

// The account is created here, server-side, with the service key — not by the
// browser calling signUp(). That keeps onboarding independent of the project's
// auth settings: it works with public sign-ups disabled, and it never sends a
// confirmation email (so there is no emailed link that can point at the wrong
// host). The client signs in with the same password once this returns.
export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } },
) {
  const body = await req.json().catch(() => ({}))
  const displayName: string | null =
    typeof body?.display_name === 'string' && body.display_name.trim().length > 0
      ? body.display_name.trim()
      : null
  const password: string = typeof body?.password === 'string' ? body.password : ''
  if (password.length < 8) {
    return NextResponse.json({ error: 'PASSWORD_TOO_SHORT' }, { status: 400 })
  }

  // Try company invite first, then BNT-admin invite.
  const { data: companyInvite } = await supabaseAdmin
    .from('invitations')
    .select('id, company_id, email, role, token, expires_at, accepted_at')
    .eq('token', params.token)
    .maybeSingle<CompanyInviteRow>()

  const { data: bntInvite } = companyInvite
    ? { data: null }
    : await supabaseAdmin
        .from('bnt_admin_invitations')
        .select('id, email, token, expires_at, accepted_at')
        .eq('token', params.token)
        .maybeSingle<BntInviteRow>()

  const invite = companyInvite ?? bntInvite
  if (!invite) return NextResponse.json({ error: 'INVITE_NOT_FOUND' }, { status: 404 })

  // Check the invite before touching auth.users, so a spent or stale token
  // can't be used to create an account.
  if (invite.accepted_at)
    return NextResponse.json({ error: 'INVITE_ALREADY_ACCEPTED' }, { status: 409 })
  if (new Date(invite.expires_at).getTime() < Date.now())
    return NextResponse.json({ error: 'INVITE_EXPIRED' }, { status: 410 })

  const resolved = await resolveUser(invite.email, password, displayName)
  if ('error' in resolved) return resolved.error
  const { userId } = resolved

  return companyInvite
    ? acceptCompanyInvite(userId, companyInvite, displayName)
    : acceptBntInvite(userId, bntInvite!, displayName)
}

/**
 * Create the invited account, or identify an existing one.
 *
 * An existing account is only accepted when the supplied password already
 * matches it — an invite token must not be usable to overwrite the password of
 * an account that happens to share the email address.
 */
async function resolveUser(
  email: string,
  password: string,
  displayName: string | null,
): Promise<{ userId: string } | { error: NextResponse }> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: displayName ? { display_name: displayName } : undefined,
  })

  if (!error && data.user) return { userId: data.user.id }

  const message = error?.message ?? ''
  if (!/already|registered|exists/i.test(message)) {
    console.error('accept-invite: createUser failed:', error)
    return {
      error: NextResponse.json({ error: 'INTERNAL', detail: message }, { status: 500 }),
    }
  }

  // Account already exists — verify the password the invitee typed.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) {
    return {
      error: NextResponse.json({ error: 'INTERNAL', detail: 'supabase env missing' }, { status: 500 }),
    }
  }
  const anon = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
    email,
    password,
  })
  if (signInError || !signIn.user) {
    return {
      error: NextResponse.json({ error: 'EXISTING_ACCOUNT_WRONG_PASSWORD' }, { status: 403 }),
    }
  }
  // Don't leave a refresh token alive for a session nobody uses.
  await anon.auth.signOut()
  return { userId: signIn.user.id }
}

async function acceptCompanyInvite(
  userId: string,
  invite: CompanyInviteRow,
  displayName: string | null,
) {
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
  invite: BntInviteRow,
  displayName: string | null,
) {
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
