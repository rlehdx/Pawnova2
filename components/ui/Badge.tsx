import { cn } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'sale' | 'new' | 'low-stock' | 'trust'
  className?: string
}

export function Badge({ children, variant = 'sale', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        {
          'bg-[var(--color-accent)] text-white': variant === 'sale',
          'bg-[var(--color-text)] text-white': variant === 'new',
          'bg-amber-100 text-amber-800': variant === 'low-stock',
          'bg-[var(--color-trust)] text-white': variant === 'trust',
        },
        className
      )}
    >
      {children}
    </span>
  )
}
