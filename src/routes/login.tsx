import * as React from 'react'
import {
  createFileRoute,
  redirect,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { getSession } from '~/lib/auth/session'
import { getBrowserSupabase } from '~/lib/supabase/client'
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  FieldHint,
  Input,
  Label,
} from '~/components/ui'

export const Route = createFileRoute('/login')({
  // Si déjà connecté : direct dashboard.
  beforeLoad: async () => {
    const session = await getSession()
    if (session) throw redirect({ to: '/' })
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const navigate = useNavigate()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const supabase = getBrowserSupabase()
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInErr) {
        // Message Supabase souvent en anglais — on traduit le cas courant.
        const msg =
          signInErr.message === 'Invalid login credentials'
            ? 'Identifiants invalides.'
            : signInErr.message
        setError(msg)
        return
      }
      // Le browser client a posé les cookies. On rejoue le routeur pour
      // que le loader de `_authenticated` lise la session fraîche, puis on
      // navigue vers la racine.
      await router.invalidate()
      await navigate({ to: '/', replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <LogoMark className="h-12 w-12 mb-3" />
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            IT College
          </h1>
          <p className="text-sm text-foreground-subtle">
            Prêt de matériel — Hackathon 2026
          </p>
        </div>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Connexion</CardTitle>
              <p className="text-sm text-foreground-subtle mt-0.5">
                Les comptes sont créés par l’administrateur — pas d’inscription
                publique.
              </p>
            </div>
          </CardHeader>
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div>
                <Label htmlFor="login-email" required>
                  Adresse e-mail
                </Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  invalid={!!error}
                />
              </div>

              <div>
                <Label htmlFor="login-pwd" required>
                  Mot de passe
                </Label>
                <Input
                  id="login-pwd"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  invalid={!!error}
                />
              </div>

              {error && (
                <div
                  className="rounded-sm border border-danger-200 bg-danger-50 px-3 py-2 text-sm text-danger-700"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? 'Connexion…' : 'Se connecter'}
              </Button>

              <FieldHint>
                Mot de passe oublié ? Contactez l’administrateur du labo.
              </FieldHint>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="3" y="6" width="10" height="20" fill="#3A3B92" />
      <rect x="19" y="6" width="10" height="20" fill="#3A3B92" />
      <rect x="11" y="11" width="10" height="10" fill="#BEDA58" />
    </svg>
  )
}
