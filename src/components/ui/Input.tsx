import * as React from 'react'
import { cn } from './cn'

const fieldBase =
  'block w-full bg-white text-foreground placeholder:text-neutral-400 ' +
  'border border-neutral-200 rounded-sm ' +
  'transition-colors transition-shadow ' +
  'focus:outline-none focus:border-marine-500 focus:shadow-[var(--shadow-ring)] ' +
  'disabled:bg-neutral-50 disabled:text-neutral-500 disabled:cursor-not-allowed ' +
  'aria-[invalid=true]:border-danger-500 aria-[invalid=true]:focus:shadow-[var(--shadow-ring-danger)]'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ className, invalid, ...props }, ref) {
    return (
      <input
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(fieldBase, 'h-10 px-3 text-sm', className)}
        {...props}
      />
    )
  },
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ className, invalid, rows = 4, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        rows={rows}
        aria-invalid={invalid || undefined}
        className={cn(fieldBase, 'px-3 py-2 text-sm resize-y min-h-20', className)}
        {...props}
      />
    )
  },
)

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          fieldBase,
          'h-10 pl-3 pr-8 text-sm appearance-none bg-no-repeat bg-[length:1rem] bg-[position:right_0.6rem_center]',
          // Chevron SVG en arrière-plan
          "bg-[url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23637692' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>\")]",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    )
  },
)

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean
}

export function Label({ children, required, className, ...props }: LabelProps) {
  return (
    <label
      className={cn(
        'block text-sm font-medium text-foreground mb-1.5',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-danger-600 ml-0.5">*</span>}
    </label>
  )
}

export function FieldHint({
  children,
  tone = 'subtle',
}: {
  children: React.ReactNode
  tone?: 'subtle' | 'error'
}) {
  return (
    <p
      className={cn(
        'mt-1.5 text-xs',
        tone === 'error' ? 'text-danger-600' : 'text-foreground-subtle',
      )}
    >
      {children}
    </p>
  )
}
