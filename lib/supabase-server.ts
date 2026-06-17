// Server-only Supabase clients. NEVER import from a 'use client' file —
// pulls in `next/headers` which is server-only.

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE = process.env.SUPABASE_SERVICE_KEY

export function supabaseServer() {
  if (!URL || !ANON) throw new Error('NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing')
  const cookieStore = cookies()
  return createServerClient(URL, ANON, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options)
          }
        } catch {
          // Called from a Server Component — Next.js disallows cookie mutation
          // there. The middleware refreshes session cookies, so it's safe to ignore.
        }
      },
    },
  })
}

// Service-role client. Falls back to placeholders at build time so missing env
// doesn't blow up the build.
export const supabaseAdmin = createClient(
  URL ?? 'https://placeholder.supabase.co',
  SERVICE ?? 'placeholder-service-key',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)
