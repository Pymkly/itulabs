/**
 * Layout "pathless" qui protège toutes les routes enfants.
 *
 * Garde : on appelle `getSession` côté serveur dans `beforeLoad`.
 * Pas de session → redirect vers /login. Sinon on expose la session
 * via le loader + un Context React (`SessionProvider`).
 *
 * Le AppLayout (header + nav + footer) du design system est mis ici,
 * ce qui garantit que /login (au niveau racine) ne l'a pas.
 */
import * as React from 'react'
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { getSession } from '~/lib/auth/session'
import { SessionProvider } from '~/lib/auth/SessionContext'
import { AppLayout } from '~/components/ui'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {
    const session = await getSession()
    if (!session) {
      throw redirect({ to: '/login' })
    }
    return { session }
  },
  loader: ({ context }) => ({ session: context.session }),
  component: AuthenticatedLayout,
})

function AuthenticatedLayout() {
  const { session } = Route.useLoaderData()
  return (
    <SessionProvider session={session}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </SessionProvider>
  )
}
