// Client-safe Supabase exports. Importable from 'use client' components.
// Server-only helpers (cookies-aware client, service-role admin) live in
// `lib/supabase-server.ts` so we don't accidentally pull `next/headers` into
// the client bundle.

import { createBrowserClient } from '@supabase/ssr'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export function supabaseBrowser() {
  if (!URL || !ANON) throw new Error('NEXT_PUBLIC_SUPABASE_URL / ANON_KEY missing')
  return createBrowserClient(URL, ANON)
}
