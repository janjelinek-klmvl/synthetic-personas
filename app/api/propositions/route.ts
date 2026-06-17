import { NextRequest, NextResponse } from 'next/server'
import { saveProposition } from '@/lib/store'
import { getCurrentCompany, NotAuthenticatedError, NoCompanyError } from '@/lib/currentCompany'
import type { IdeaBrief, IdeaType } from '@/lib/types'

interface Body {
  idea?: string
  idea_type?: IdeaType
  brief?: IdeaBrief
  file_content?: string
}

export async function POST(request: NextRequest) {
  let ctx
  try {
    ctx = await getCurrentCompany()
  } catch (e) {
    if (e instanceof NotAuthenticatedError) return NextResponse.json({ error: 'NOT_AUTHENTICATED' }, { status: 401 })
    if (e instanceof NoCompanyError) return NextResponse.json({ error: 'NO_COMPANY' }, { status: 403 })
    throw e
  }

  const body = (await request.json().catch(() => null)) as Body | null
  if (!body?.idea || !body.idea_type) {
    return NextResponse.json({ error: 'idea and idea_type are required' }, { status: 400 })
  }
  const record = await saveProposition(
    { companyId: ctx.companyId, userId: ctx.userId },
    {
      idea: body.idea.trim(),
      idea_type: body.idea_type,
      brief: body.brief ?? {},
      file_content: body.file_content,
    },
  )
  return NextResponse.json(record, { status: 201 })
}
