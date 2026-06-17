// Resolves the logged-in user's company from their session.
//
// Three identity flavours:
//   1. Company user — row in `profiles`. company_id is fixed.
//   2. BNT super-admin — row in `bnt_admins`. They pick a company to view
//      through (cookie `sp_imp_co`). Acts as admin of the chosen company.
//   3. Auth.users only — no profile, no bnt_admins row. Treated as "not
//      onboarded" and bounced to /login.
//
// A user with both `profiles` and `bnt_admins` rows is treated as a company
// user (profile wins). This is unusual but possible if a BNT admin later
// accepts a company invite.

import { cookies } from 'next/headers'
import { supabaseAdmin, supabaseServer } from './supabase-server'

export const IMPERSONATION_COOKIE = 'sp_imp_co'

export type ProfileKind = 'company_user' | 'bnt_admin_impersonating' | 'bnt_admin_idle'

export interface CurrentCompany {
  userId: string
  email: string | null
  role: 'admin' | 'member'
  displayName: string | null
  companyId: string
  companyName: string
  apiKey: string
  audienceAccess: string[]
  quantMetricAccess: string[]
  qualModuleAccess: string[]
  active: boolean
  creditBalance: number
  impersonating: boolean
  isBntAdmin: boolean
}

export class NotAuthenticatedError extends Error {
  constructor() { super('NOT_AUTHENTICATED') }
}

/** Thrown when the user is a BNT admin who hasn't picked a company yet. */
export class NoActiveCompanyError extends Error {
  isBntAdmin = true
  constructor() { super('NO_ACTIVE_COMPANY') }
}

/** Thrown when the user is neither a company user nor a BNT admin. */
export class NoCompanyError extends Error {
  constructor() { super('NO_COMPANY') }
}

interface CompanyRow {
  id: string
  org_name: string
  api_key: string
  audience_access: string[]
  quant_metric_access: string[]
  qual_module_access: string[]
  active: boolean
  credit_balance: number | null
}

async function loadCompany(companyId: string): Promise<CompanyRow | null> {
  const { data } = await supabaseAdmin
    .from('api_clients')
    .select('id, org_name, api_key, audience_access, quant_metric_access, qual_module_access, active, credit_balance')
    .eq('id', companyId)
    .single<CompanyRow>()
  return data
}

async function isBntAdminRow(userId: string): Promise<{ display_name: string | null } | null> {
  const { data } = await supabaseAdmin
    .from('bnt_admins')
    .select('user_id, display_name')
    .eq('user_id', userId)
    .maybeSingle<{ user_id: string; display_name: string | null }>()
  return data ? { display_name: data.display_name } : null
}

export async function getCurrentCompany(): Promise<CurrentCompany> {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new NotAuthenticatedError()

  // Path 1: regular company user.
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, company_id, role, display_name')
    .eq('id', user.id)
    .maybeSingle<{
      id: string
      company_id: string
      role: 'admin' | 'member'
      display_name: string | null
    }>()

  if (profile) {
    const company = await loadCompany(profile.company_id)
    if (!company) throw new NoCompanyError()
    return {
      userId: user.id,
      email: user.email ?? null,
      role: profile.role,
      displayName: profile.display_name,
      companyId: company.id,
      companyName: company.org_name,
      apiKey: company.api_key,
      audienceAccess: company.audience_access ?? [],
      quantMetricAccess: company.quant_metric_access ?? [],
      qualModuleAccess: company.qual_module_access ?? [],
      active: company.active,
      creditBalance: company.credit_balance ?? 0,
      impersonating: false,
      isBntAdmin: false,
    }
  }

  // Path 2: BNT super-admin.
  const bntAdmin = await isBntAdminRow(user.id)
  if (bntAdmin) {
    const impCompanyId = cookies().get(IMPERSONATION_COOKIE)?.value
    if (impCompanyId) {
      const company = await loadCompany(impCompanyId)
      if (company) {
        return {
          userId: user.id,
          email: user.email ?? null,
          role: 'admin',
          displayName: bntAdmin.display_name ?? user.email?.split('@')[0] ?? 'Admin',
          companyId: company.id,
          companyName: company.org_name,
          apiKey: company.api_key,
          audienceAccess: company.audience_access ?? [],
          quantMetricAccess: company.quant_metric_access ?? [],
          qualModuleAccess: company.qual_module_access ?? [],
          active: company.active,
          creditBalance: company.credit_balance ?? 0,
          impersonating: true,
          isBntAdmin: true,
        }
      }
      // Stale cookie pointing at a deleted company — clear by falling through.
    }
    throw new NoActiveCompanyError()
  }

  // Path 3: nothing — not onboarded.
  throw new NoCompanyError()
}

/** Lightweight check for the AppHeader / switcher: is the current user a BNT admin? */
export async function getBntAdminStatus(): Promise<{ userId: string; displayName: string | null } | null> {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const row = await isBntAdminRow(user.id)
  if (!row) return null
  return { userId: user.id, displayName: row.display_name }
}
