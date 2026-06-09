import * as React from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from './cn'

type ActiveNavItem = { to: '/' | '/styleguide'; label: string; soon?: false }
type PendingNavItem = { label: string; soon: true }
type NavItem = ActiveNavItem | PendingNavItem

// Reflète les écrans cibles. `soon: true` = route pas encore créée,
// affichée en désactivé pour qu'on visualise la nav finale.
const NAV: NavItem[] = [
  { to: '/',           label: 'Tableau de bord' },
  { label: 'Catalogue',  soon: true },
  { label: 'Achats',     soon: true },
  { label: 'Emprunts',   soon: true },
  { label: 'Retours',    soon: true },
  { to: '/styleguide', label: 'Styleguide' },
]

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  )
}

function Header() {
  return (
    <header className="bg-surface border-b border-border">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <LogoMark className="h-7 w-7" />
          <span className="font-semibold text-foreground tracking-tight">
            IT College{' '}
            <span className="text-foreground-subtle font-normal">
              · Prêt de matériel
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {NAV.map((item) =>
            item.soon ? (
              <span
                key={item.label}
                title="Bientôt"
                className="px-3 py-1.5 rounded-sm text-sm font-medium text-foreground-subtle/60 cursor-not-allowed"
              >
                {item.label}
              </span>
            ) : (
              <Link
                key={item.to}
                to={item.to}
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
            ),
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex flex-col text-right leading-tight">
            <span className="text-xs text-foreground-subtle">Connecté</span>
            <span className="text-sm font-medium text-foreground">
              Démo · super
            </span>
          </div>
          <div
            aria-hidden
            className="h-9 w-9 rounded-full bg-marine-600 text-white flex items-center justify-center text-sm font-semibold"
          >
            D
          </div>
        </div>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-4 text-xs text-foreground-subtle flex items-center justify-between">
        <span>© IT College · Hackathon Juin 2026</span>
        <span>v0 — Design system</span>
      </div>
    </footer>
  )
}

/* Mini logo : référence libre au logo officiel (carré marine + carré lime). */
function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect x="3"  y="6"  width="10" height="20" fill="#3A3B92" />
      <rect x="19" y="6"  width="10" height="20" fill="#3A3B92" />
      <rect x="11" y="11" width="10" height="10" fill="#BEDA58" />
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
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-foreground-subtle max-w-2xl">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
