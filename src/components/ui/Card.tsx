import * as React from 'react'
import { cn } from './cn'

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'bg-surface border border-border rounded-lg shadow-xs',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-5 py-4 border-b border-border flex items-start justify-between gap-4',
        className,
      )}
      {...props}
    />
  )
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-foreground-subtle mt-0.5', className)}
      {...props}
    />
  )
}

export function CardBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('px-5 py-4', className)} {...props} />
}

export function CardFooter({
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
