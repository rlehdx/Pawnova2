import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env: ${key}`)
  return value
}

// Auth-aware server client — reads session from cookies
export async function createAuthClient() {
  const cookieStore = await cookies()
  return createSupabaseServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // middleware에서 setAll 호출 시 무시 가능
          }
        },
      },
    }
  )
}

// Service role client — RLS 우회, admin API에서만 사용
export function createAdminClient() {
  return createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
