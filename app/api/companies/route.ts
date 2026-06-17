import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getBntAdminStatus } from '@/lib/currentCompany'

// GET /api/companies — list of all companies, for the BNT super-admin
// switcher. 403 for non-admins.
export async function GET() {
  const staff = await getBntAdminStatus()
  if (!staff) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })

  const { data } = await supabaseAdmin
    .from('api_clients')
    .select('id, org_name, active')
    .order('org_name', { ascending: true })

  return NextResponse.json({ companies: data ?? [] })
}
