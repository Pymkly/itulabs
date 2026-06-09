/**
 * Supabase client BROWSER.
 *
 * Utilise `@supabase/ssr` qui stocke la session dans des cookies
 * (et non localStorage) — ainsi le serveur peut la lire pour faire
 * du SSR authentifié dans les loaders / server functions.
 *
 * Toujours la clé anon : la service_role n'arrive JAMAIS dans le bundle.
 */
import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Variables VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY manquantes (voir .env.example).',
  )
}

// Singleton — éviter de recréer un client à chaque rendu.
let _client: SupabaseClient<Database> | null = null

export function getBrowserSupabase(): SupabaseClient<Database> {
  if (_client) return _client
  _client = createBrowserClient<Database>(url, anonKey)
  return _client
}
