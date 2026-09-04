import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public routes (no auth required).
function isPublic(pathname: string): boolean {
  if (pathname === '/login') return true
  if (pathname.startsWith('/accept-invite/')) return true
  // Password-recovery landing. The recovery token lives in the URL hash, so
  // the server can't see a session here — gating it would bounce the user to
  // /login before the client can read the token.
  if (pathname === '/update-password') return true
  if (pathname.startsWith('/api/accept-invite/')) return true
  if (pathname.startsWith('/_next')) return true
  if (pathname.startsWith('/favicon')) return true
  if (pathname === '/auth/callback') return true
  return false
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) {
    if (pathname === '/login') {
      // If already authenticated, send to home.
      let response = NextResponse.next({ request })
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
              response = NextResponse.next({ request })
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options),
              )
            },
          },
        },
      )
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        return NextResponse.redirect(new URL('/', request.url))
      }
      return response
    }
    return NextResponse.next()
  }

  // Gated path — require an auth session.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const url = new URL('/login', request.url)
    if (pathname !== '/') url.searchParams.set('next', pathname)
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
