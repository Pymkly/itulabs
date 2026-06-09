import * as React from 'react'
import { cn } from './cn'

/**
 * Modale centrée. Overlay sombre + carte sur fond surface, fermable
 * via ESC, clic sur l'overlay ou bouton X. Verrouille le scroll de
 * la page tant qu'ouverte. Réutilise les tokens du design system.
 *
 * Usage :
 *   <Modal open={open} onClose={...} title="Nouveau matériel">
 *     <ModalBody>...</ModalBody>
 *     <ModalFooter>...</ModalFooter>
 *   </Modal>
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}) {
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

  if (!open) return null

  const widths: Record<typeof size, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-marine-950/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className={cn(
          'relative w-full bg-surface rounded-lg shadow-xl border border-border max-h-[calc(100vh-2rem)] flex flex-col',
          widths[size],
        )}
        // empêche le clic dans la modale de fermer
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-border flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            {description && (
              <p className="text-sm text-foreground-subtle mt-0.5">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="inline-flex items-center justify-center h-8 w-8 rounded-md text-foreground-muted hover:bg-marine-50 hover:text-foreground transition-colors shrink-0"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function ModalBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('px-5 py-4 overflow-y-auto', className)}
      {...props}
    />
  )
}

export function ModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-3 border-t border-border bg-neutral-50 rounded-b-lg flex items-center justify-end gap-2',
        className,
      )}
      {...props}
    />
  )
}
