import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]':
              variant === 'primary',
            'border border-[var(--color-divider)] bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface)]':
              variant === 'outline',
            'bg-transparent text-[var(--color-text)] hover:text-[var(--color-accent)]':
              variant === 'ghost',
          },
          {
            'h-8 rounded-[var(--radius-btn)] px-3 text-sm': size === 'sm',
            'h-10 rounded-[var(--radius-btn)] px-5 text-sm': size === 'md',
            'h-12 rounded-[var(--radius-btn)] px-8 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {children}
          </span>
        ) : (
          children
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
