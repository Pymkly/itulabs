import * as React from 'react'
import { useNavigate, useRouter } from '@tanstack/react-router'
import { getBrowserSupabase } from '../supabase/client'
import type { Session } from './session'

interface SessionContextValue {
  session: Session
  signOut: () => Promise<void>
}

const SessionContext = React.createContext<SessionContextValue | null>(null)

export function SessionProvider({
  session,
  children,
}: {
  session: Session
  children: React.ReactNode
}) {
  const router = useRouter()
  const navigate = useNavigate()

  const signOut = React.useCallback(async () => {
    const supabase = getBrowserSupabase()
    await supabase.auth.signOut()
    // Invalider pour que tous les loaders se rejouent avec la session vide,
    // puis renvoyer sur /login.
    await router.invalidate()
    await navigate({ to: '/login', replace: true })
  }, [router, navigate])

  const value = React.useMemo(
    () => ({ session, signOut }),
    [session, signOut],
  )

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext)
  if (!ctx) {
    throw new Error(
      'useSession() doit être appelé dans une zone authentifiée (sous SessionProvider).',
    )
  }
  return ctx
}
