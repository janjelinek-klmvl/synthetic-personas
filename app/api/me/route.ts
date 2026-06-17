import { NextResponse } from 'next/server'
import {
  getCurrentCompany,
  getBntAdminStatus,
  NoActiveCompanyError,
  NoCompanyError,
  NotAuthenticatedError,
} from '@/lib/currentCompany'

// GET /api/me — returns the current view's identity, company, and BNT-admin
// status. Used by AppHeader and ImpersonationBanner.
//
// Response shapes:
//   200 { user, company, role, impersonating, is_bnt_admin }
//   200 { user, company: null, role: null, impersonating: false, is_bnt_admin: true }
//     when a BNT admin hasn't picked a company yet
//   401 { error: 'NOT_AUTHENTICATED' }
//   403 { error: 'NO_COMPANY' } — onboarded user with no company link
export async function GET() {
  try {
    const ctx = await getCurrentCompany()
    return NextResponse.json({
      user: { id: ctx.userId, email: ctx.email, display_name: ctx.displayName },
      company: {
        id: ctx.companyId,
        name: ctx.companyName,
        active: ctx.active,
        credit_balance: ctx.creditBalance,
      },
      role: ctx.role,
      impersonating: ctx.impersonating,
      is_bnt_admin: ctx.isBntAdmin,
    })
  } catch (e) {
    if (e instanceof NotAuthenticatedError) {
      return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    }
    if (e instanceof NoActiveCompanyError) {
      // BNT admin not impersonating yet — return identity but no company.
      const staff = await getBntAdminStatus()
      return NextResponse.json({
        user: { id: staff?.userId ?? null, email: null, display_name: staff?.displayName ?? null },
        company: null,
        role: null,
        impersonating: false,
        is_bnt_admin: true,
      })
    }
    if (e instanceof NoCompanyError) {
      return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    }
    throw e
  }
}
