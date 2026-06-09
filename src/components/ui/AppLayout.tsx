import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from './cn'
import { Button } from './Button'
import { useSession } from '~/lib/auth/SessionContext'
import type { Role } from '~/lib/auth/session'

type RouteTo = '/' | '/styleguide' | '/catalogue'

type ActiveNavItem = { to: RouteTo; label: string; soon?: false }
type PendingNavItem = { label: string; soon: true }
type NavItem = ActiveNavItem | PendingNavItem

// Items affichés pour chaque rôle. Les items `soon: true` correspondent aux
// écrans pas encore construits — gardés visibles pour montrer la nav finale.
const NAV_BY_ROLE: Record<Role, NavItem[]> = {
  super: [
    { to: '/',           label: 'Tableau de bord' },
    { to: '/catalogue',  label: 'Catalogue' },
    { label: 'Achats',     soon: true },
    { label: 'Emprunts',   soon: true },
    { label: 'Retours',    soon: true },
    { to: '/styleguide', label: 'Styleguide' },
  ],
  responsable: [
    { to: '/',           label: 'Tableau de bord' },
    { to: '/catalogue',  label: 'Catalogue' },
    { label: 'Emprunts',      soon: true },
    { label: 'Retours',       soon: true },
  ],
  equipe: [
    { to: '/',           label: 'Tableau de bord' },
    { to: '/catalogue',  label: 'Catalogue' },
    { label: 'Mes emprunts',  soon: true },
    { label: 'Mes retours',   soon: true },
  ],
}

const ROLE_LABEL: Record<Role, string> = {
  super: 'Administrateur',
  responsable: 'Responsable',
  equipe: 'Équipe',
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto min-w-0 px-4 sm:px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function Header() {
  const { session, signOut } = useSession()
  const items = NAV_BY_ROLE[session.profil.role]
  const initial = (session.user.email ?? '?').slice(0, 1).toUpperCase()
  const [signingOut, setSigningOut] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    try {
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2.5 min-w-0">
          <LogoMark className="h-7 w-7 shrink-0" />
          <span className="font-semibold text-foreground tracking-tight whitespace-nowrap truncate">
            IT College{' '}
            <span className="hidden sm:inline text-foreground-subtle font-normal">
              · Prêt de matériel
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3 shrink-0">
          {/* Nav desktop (≥ lg) */}
          <nav className="hidden lg:flex items-center gap-1">
            {items.map((item) => (
              <NavItemLink key={navKey(item)} item={item} />
            ))}
          </nav>

          {/* Bloc profil + déconnexion — desktop */}
          <div className="hidden lg:flex items-center gap-3 pl-3 border-l border-border">
            <ProfileSummary email={session.user.email} role={session.profil.role} />
            <Avatar initial={initial} />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              disabled={signingOut}
            >
              {signingOut ? '…' : 'Déconnexion'}
            </Button>
          </div>

          {/* Hamburger — < lg */}
          <button
            type="button"
            className="lg:hidden inline-flex items-center justify-center h-10 w-10 rounded-md text-foreground-muted hover:bg-marine-50 hover:text-foreground transition-colors"
            aria-label="Ouvrir le menu"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            onClick={() => setMobileOpen(true)}
          >
            <BurgerIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        items={items}
        email={session.user.email}
        role={session.profil.role}
        initial={initial}
        onSignOut={handleSignOut}
        signingOut={signingOut}
      />
    </header>
  )
}

function navKey(item: NavItem): string {
  return 'to' in item ? item.to : item.label
}

function NavItemLink({
  item,
  onClick,
}: {
  item: NavItem
  onClick?: () => void
}) {
  if (item.soon) {
    return (
      <span
        title="Bientôt"
        className="px-3 py-1.5 rounded-sm text-sm font-medium text-foreground-subtle/60 cursor-not-allowed"
      >
        {item.label}
      </span>
    )
  }
  return (
    <Link
      to={item.to}
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-sm text-sm font-medium transition-colors',
        'text-foreground-muted hover:text-foreground hover:bg-marine-50',
      )}
      activeProps={{
        className:
          'px-3 py-1.5 rounded-sm text-sm font-medium bg-marine-50 text-marine-700',
      }}
      activeOptions={{ exact: item.to === '/' }}
    >
      {item.label}
    </Link>
  )
}

function ProfileSummary({
  email,
  role,
}: {
  email: string | null
  role: Role
}) {
  return (
    <div className="flex flex-col text-right leading-tight">
      <span className="text-xs text-foreground-subtle">{ROLE_LABEL[role]}</span>
      <span className="text-sm font-medium text-foreground truncate max-w-[14rem]">
        {email ?? '—'}
      </span>
    </div>
  )
}

function Avatar({ initial }: { initial: string }) {
  return (
    <div
      aria-hidden
      className="h-9 w-9 shrink-0 rounded-full bg-marine-600 text-white flex items-center justify-center text-sm font-semibold"
    >
      {initial}
    </div>
  )
}

function MobileDrawer({
  open,
  onClose,
  items,
  email,
  role,
  initial,
  onSignOut,
  signingOut,
}: {
  open: boolean
  onClose: () => void
  items: NavItem[]
  email: string | null
  role: Role
  initial: string
  onSignOut: () => void | Promise<void>
  signingOut: boolean
}) {
  // ESC pour fermer + lock du scroll du body quand ouvert.
  React.useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  return (
    <div
      id="mobile-menu"
      role={open ? 'dialog' : undefined}
      aria-modal={open ? 'true' : undefined}
      aria-hidden={!open}
      className={cn(
        'lg:hidden fixed inset-0 z-50',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      )}
    >
      {/* Overlay */}
      <div
        className={cn(
          'absolute inset-0 bg-marine-950/40 transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Panneau */}
      <aside
        className={cn(
          'absolute inset-y-0 right-0 w-[min(20rem,100%)] bg-surface shadow-xl flex flex-col',
          'transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {/* En-tête du panneau */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-border">
          <span className="text-sm font-semibold text-foreground">Menu</span>
          <button
            type="button"
            className="inline-flex items-center justify-center h-10 w-10 rounded-md text-foreground-muted hover:bg-marine-50 hover:text-foreground transition-colors"
            aria-label="Fermer le menu"
            onClick={onClose}
          >
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Profil */}
        <div className="px-4 py-4 border-b border-border flex items-center gap-3">
          <Avatar initial={initial} />
          <div className="flex flex-col leading-tight min-w-0">
            <span className="text-xs text-foreground-subtle">
              {ROLE_LABEL[role]}
            </span>
            <span className="text-sm font-medium text-foreground truncate">
              {email ?? '—'}
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-3 flex flex-col gap-0.5">
          {items.map((item) =>
            item.soon ? (
              <span
                key={item.label}
                title="Bientôt"
                className="px-3 py-2 rounded-sm text-sm font-medium text-foreground-subtle/60 cursor-not-allowed"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.to}
                to={item.to}
                onClick={onClose}
                className={cn(
                  'px-3 py-2 rounded-sm text-sm font-medium transition-colors',
                  'text-foreground-muted hover:text-foreground hover:bg-marine-50',
                )}
                activeProps={{
                  className:
                    'px-3 py-2 rounded-sm text-sm font-medium bg-marine-50 text-marine-700',
                }}
                activeOptions={{ exact: item.to === '/' }}
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>

        {/* Actions bas — déconnexion + futurs boutons */}
        <div className="border-t border-border p-3 flex flex-col gap-2">
          <Button
            variant="secondary"
            size="md"
            onClick={onSignOut}
            disabled={signingOut}
            className="w-full"
          >
            {signingOut ? 'Déconnexion…' : 'Se déconnecter'}
          </Button>
        </div>
      </aside>
    </div>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs text-foreground-subtle flex items-center justify-between gap-4">
        <span className="truncate">© IT College · Hackathon Juin 2026</span>
        <span className="shrink-0">v0 — Auth + rôles</span>
      </div>
    </footer>
  )
}

/* Mini logo : référence libre au logo officiel (carré marine + carré lime). */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="3" y="6" width="10" height="20" fill="#3A3B92" />
      <rect x="19" y="6" width="10" height="20" fill="#3A3B92" />
      <rect x="11" y="11" width="10" height="10" fill="#BEDA58" />
    </svg>
  )
}

function BurgerIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  )
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-6">
      <div className="min-w-0 flex-1">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight [overflow-wrap:anywhere]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-foreground-subtle max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  )
}
