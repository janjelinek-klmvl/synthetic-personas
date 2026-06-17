import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'ADMIN_ONLY' }, { status: 403 })

  const { error, count } = await supabaseAdmin
    .from('invitations')
    .delete({ count: 'exact' })
    .eq('id', params.id)
    .eq('company_id', ctx.companyId)
    .is('accepted_at', null)
  if (error) return NextResponse.json({ error: 'INTERNAL', detail: error.message }, { status: 500 })
  if (!count) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json({ deleted: params.id })
}
