import * as React from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

const base =
  'inline-flex items-center justify-center gap-2 font-medium ' +
  'rounded-md transition-colors transition-shadow ' +
  'focus-visible:outline-none focus-visible:shadow-[var(--shadow-ring)] ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none ' +
  'select-none whitespace-nowrap'

const sizes: Record<Size, string> = {
  sm: 'h-8  px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
}

const variants: Record<Variant, string> = {
  // Primaire : marine plein, blanc dessus, accent lime au survol via hover ring
  primary:
    'bg-marine-600 text-white shadow-xs ' +
    'hover:bg-marine-700 active:bg-marine-800',

  // Secondaire : surface blanche, bord marine, texte marine
  secondary:
    'bg-white text-marine-700 border border-marine-200 ' +
    'hover:bg-marine-50 hover:border-marine-300 active:bg-marine-100',

  // Discret : pas de fond, juste du texte — pour actions tertiaires
  ghost:
    'bg-transparent text-marine-700 ' +
    'hover:bg-marine-50 active:bg-marine-100',

  // Danger : actions destructives
  danger:
    'bg-danger-600 text-white shadow-xs ' +
    'hover:bg-danger-700 active:bg-danger-800 ' +
    'focus-visible:shadow-[var(--shadow-ring-danger)]',
}

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = 'primary', size = 'md', className, ...props },
    ref,
  ) {
    return (
      <button
        ref={ref}
        className={cn(base, sizes[size], variants[variant], className)}
        {...props}
      />
    )
  },
)
