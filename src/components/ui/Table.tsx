import * as React from 'react'
import { cn } from './cn'

export function Table({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto border border-border rounded-lg bg-surface">
      <table
        className={cn('w-full text-sm border-collapse', className)}
        {...props}
      />
    </div>
  )
}

export function THead({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-neutral-50 text-foreground-subtle', className)}
      {...props}
    />
  )
}

export function TBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-border', className)}
      {...props}
    />
  )
}

export function TR({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('hover:bg-marine-50/50 transition-colors', className)}
      {...props}
    />
  )
}

export function TH({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'text-left font-medium text-xs uppercase tracking-wide px-4 py-2.5',
        className,
      )}
      {...props}
    />
  )
}

export function TD({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-2.5 text-foreground-muted', className)}
      {...props}
    />
  )
}
