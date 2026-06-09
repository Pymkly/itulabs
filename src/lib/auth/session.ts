/**
 * Session de l'utilisateur connecté.
 *
 * `getSession` est une server function : elle lit la session depuis les cookies
 * (côté serveur), puis va chercher la ligne `profils` correspondante pour
 * récupérer le rôle et l'équipe. Si pas connecté → null.
 *
 * Utilisée dans le loader du layout `_authenticated` pour décider de la garde
 * de route et alimenter le contexte React côté client.
 */
import { createServerFn } from '@tanstack/react-start'
import { getServerSupabase } from '../supabase/server'
import type { Database } from '../supabase/database.types'

export type Role = Database['public']['Enums']['role_profil'] // 'super' | 'responsable' | 'equipe'

export interface SessionUser {
  id: string
  email: string | null
}

export interface SessionProfil {
  id: string
  role: Role
  equipe_id: string | null
  responsable_id: string | null
}

export interface Session {
  user: SessionUser
  profil: SessionProfil
}

export const getSession = createServerFn({ method: 'GET' }).handler(
  async (): Promise<Session | null> => {
    const supabase = getServerSupabase()

    // getUser() vérifie le JWT avec Supabase Auth (plus sûr que getSession() seul).
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser()

    if (userErr || !user) return null

    const { data: profil, error: profilErr } = await supabase
      .from('profils')
      .select('id, role, equipe_id, responsable_id')
      .eq('id', user.id)
      .single()

    if (profilErr || !profil) {
      // L'utilisateur est authentifié mais n'a pas de ligne `profils`.
      // C'est un état "compte créé mais pas provisionné". On retourne null
      // pour pousser vers /login avec un message ; le super doit créer la ligne.
      return null
    }

    return {
      user: { id: user.id, email: user.email ?? null },
      profil,
    }
  },
)
