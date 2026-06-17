import { NextResponse } from 'next/server'
import { loadProposition } from '@/lib/store'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  let session
  try {
    session = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }
  const { id } = ctx.params
  const record = await loadProposition({ companyId: session.companyId }, id)
  if (!record) return NextResponse.json({ error: 'NOT_FOUND' }, { status: 404 })
  return NextResponse.json(record)
}
