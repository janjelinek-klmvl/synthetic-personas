import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'

export async function GET() {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }

  // Profiles in this company.
  const { data: profiles } = await supabaseAdmin
    .from('profiles')
    .select('id, role, display_name, created_at')
    .eq('company_id', ctx.companyId)
    .order('created_at', { ascending: true })

  // Join with auth.users for email. supabaseAdmin can read auth schema.
  const ids = (profiles ?? []).map((p) => p.id)
  let emails: Record<string, string | null> = {}
  if (ids.length > 0) {
    // listUsers is paginated; for v1 fetch one page (up to 1000 users is fine).
    const { data: usersList } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    emails = Object.fromEntries(
      (usersList?.users ?? [])
        .filter((u) => ids.includes(u.id))
        .map((u) => [u.id, u.email ?? null]),
    )
  }

  const members = (profiles ?? []).map((p) => ({
    id: p.id,
    role: p.role,
    display_name: p.display_name,
    email: emails[p.id] ?? null,
    is_me: p.id === ctx.userId,
    created_at: p.created_at,
  }))

  return NextResponse.json({ members })
}
