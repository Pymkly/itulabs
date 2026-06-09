import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Variable d'environnement manquante : ${name}`)
  }
  return value
}

export function getServerSupabase(): SupabaseClient {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_ANON_KEY'),
  )
}

export function getServiceRoleSupabase(): SupabaseClient {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}
