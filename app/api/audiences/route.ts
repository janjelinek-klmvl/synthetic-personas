import { NextResponse } from 'next/server'
import { listAudiences } from '@/lib/audienceStudio'
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
  try {
    const data = await listAudiences(ctx.apiKey)
    return NextResponse.json(data)
  } catch (err) {
    const e = err as Error & { status?: number; detail?: unknown }
    return NextResponse.json(
      { error: e.message, detail: e.detail ?? null },
      { status: e.status ?? 502 }
    )
  }
}
