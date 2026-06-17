import { NextResponse } from 'next/server'
import { IMPERSONATION_COOKIE } from '@/lib/currentCompany'

// POST /api/impersonate/end — clears the impersonation cookie.
export async function POST() {
  const response = NextResponse.json({ ok: true })
  response.cookies.set({
    name: IMPERSONATION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
  return response
}
