/**
 * Supabase client SERVEUR.
 *
 * Utilise `@supabase/ssr` `createServerClient` qui prend `cookies.getAll/setAll`
 * branchés sur les primitives TanStack Start (`getRequestHeader`,
 * `setResponseHeader`). Ainsi :
 * - la session est lue depuis les cookies de la request entrante
 * - les cookies rafraîchis (refresh token) sont posés dans la response
 *
 * Toujours la clé anon : la RLS s'applique normalement (l'utilisateur agit
 * en son nom). La service_role ne s'utilise qu'aux endroits explicitement
 * privilégiés (jamais exposée au client).
 */
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  getRequestHeader,
  setResponseHeader,
} from '@tanstack/react-start/server'
import type { Database } from './database.types'

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v) throw new Error(`Variable d'environnement manquante : ${name}`)
  return v
}

function parseCookies(cookieHeader: string | undefined) {
  if (!cookieHeader) return [] as { name: string; value: string }[]
  return cookieHeader
    .split(';')
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const i = c.indexOf('=')
      if (i === -1) return { name: c, value: '' }
      return {
        name: c.slice(0, i),
        value: decodeURIComponent(c.slice(i + 1)),
      }
    })
}

function serializeCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
): string {
  const parts: string[] = [`${name}=${encodeURIComponent(value)}`]
  if (options.maxAge != null) parts.push(`Max-Age=${options.maxAge}`)
  if (options.expires) parts.push(`Expires=${options.expires.toUTCString()}`)
  parts.push(`Path=${options.path ?? '/'}`)
  if (options.domain) parts.push(`Domain=${options.domain}`)
  parts.push(`SameSite=${options.sameSite ?? 'Lax'}`)
  if (options.httpOnly !== false) parts.push('HttpOnly')
  if (options.secure !== false) parts.push('Secure')
  return parts.join('; ')
}

/**
 * Client à utiliser dans une server function ou un loader server-side.
 * Lit/écrit les cookies de la requête en cours.
 */
export function getServerSupabase(): SupabaseClient<Database> {
  return createServerClient<Database>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return parseCookies(getRequestHeader('cookie'))
        },
        setAll(toSet) {
          // setResponseHeader pour 'Set-Cookie' accepte un array.
          const serialized = toSet.map(({ name, value, options }) =>
            serializeCookie(name, value, options),
          )
          if (serialized.length > 0) {
            setResponseHeader('Set-Cookie', serialized)
          }
        },
      },
    },
  )
}

/**
 * Client privilégié (clé service_role) — RLS contournée.
 * À utiliser UNIQUEMENT pour des tâches admin côté serveur (jamais exposé au client).
 */
export function getServiceRoleSupabase(): SupabaseClient<Database> {
  return createServerClient<Database>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY'),
    {
      cookies: { getAll: () => [], setAll: () => {} },
    },
  )
}
