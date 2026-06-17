import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { IMPERSONATION_COOKIE, getBntAdminStatus } from '@/lib/currentCompany'

// GET /impersonate?company_id=<uuid>&next=<path>
// Sets the impersonation cookie if the caller is in bnt_admins.
// Redirects to `next` (default `/`).
export async function GET(request: NextRequest) {
  const companyId = request.nextUrl.searchParams.get('company_id')
  const next = request.nextUrl.searchParams.get('next') ?? '/'
  if (!companyId) {
    return NextResponse.redirect(new URL('/login?reason=impersonate_missing_id', request.url))
  }

  const staff = await getBntAdminStatus()
  if (!staff) {
    return NextResponse.redirect(new URL('/login?reason=impersonate_forbidden', request.url))
  }

  // Confirm the target company exists. (Cheap; protects against typo'd ids.)
  const { data: company } = await supabaseAdmin
    .from('api_clients')
    .select('id')
    .eq('id', companyId)
    .single<{ id: string }>()
  if (!company) {
    return NextResponse.redirect(new URL('/?reason=impersonate_no_such_company', request.url))
  }

  const response = NextResponse.redirect(new URL(next, request.url))
  response.cookies.set({
    name: IMPERSONATION_COOKIE,
    value: company.id,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8, // 8 hours
  })
  return response
}
