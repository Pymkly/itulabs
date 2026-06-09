import * as React from 'react'
import { cn } from './cn'

type Tone =
  | 'neutral'
  | 'marine'
  | 'lime'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'

const tones: Record<Tone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  marine:  'bg-marine-50  text-marine-700  border-marine-200',
  lime:    'bg-lime-100   text-lime-800    border-lime-300',
  success: 'bg-success-50 text-success-800 border-success-200',
  warning: 'bg-warning-50 text-warning-800 border-warning-200',
  danger:  'bg-danger-50  text-danger-700  border-danger-200',
  info:    'bg-info-50    text-info-800    border-info-200',
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-xs font-medium border',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}

/* ----- Badges métier : statuts du projet --------------------------------- *
 * Ces wrappers fixent les libellés et tons pour éviter la divergence
 * entre écrans. Toujours utiliser ceux-ci pour afficher un statut. */

export type StatutDemande = 'demande' | 'valide' | 'refuse'
export function StatutBadge({ statut }: { statut: StatutDemande }) {
  const map: Record<StatutDemande, { tone: Tone; label: string }> = {
    demande: { tone: 'warning', label: 'Demande' },
    valide:  { tone: 'success', label: 'Validé' },
    refuse:  { tone: 'danger',  label: 'Refusé' },
  }
  const { tone, label } = map[statut]
  return <Badge tone={tone}>{label}</Badge>
}

export type EtatEmprunt = 'en_cours' | 'rendu'
export function EtatBadge({ etat }: { etat: EtatEmprunt }) {
  const map: Record<EtatEmprunt, { tone: Tone; label: string }> = {
    en_cours: { tone: 'marine', label: 'En cours' },
    rendu:    { tone: 'neutral', label: 'Rendu' },
  }
  const { tone, label } = map[etat]
  return <Badge tone={tone}>{label}</Badge>
}
