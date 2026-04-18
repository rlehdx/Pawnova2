'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Minus, Plus, X } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { formatPrice } from '@/lib/utils'
import type { CartLine } from '@/types/database'

interface CartItemProps {
  line: CartLine
}

export function CartItem({ line }: CartItemProps) {
  const { updateQuantity, removeItem, isLoading } = useCart()

  return (
    <div className="flex gap-3 py-4">
      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface)]">
        {line.image ? (
          <Image
            src={line.image.url}
            alt={line.image.altText ?? line.productTitle}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[var(--color-divider)]" />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <Link
            href={`/shop/${line.productHandle}`}
            className="text-sm font-medium leading-tight hover:text-[var(--color-accent)] transition-colors line-clamp-2"
            style={{ color: 'var(--color-text)' }}
          >
            {line.productTitle}
          </Link>
          <button
            onClick={() => removeItem(line.id)}
            disabled={isLoading}
            aria-label="Remove item"
            className="flex-shrink-0 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {line.variantTitle && line.variantTitle !== 'Default' && (
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {line.variantTitle}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between">
          <div className="flex items-center rounded border border-[var(--color-divider)] overflow-hidden">
            <button
              onClick={() => {
                if (line.quantity <= 1) {
                  removeItem(line.id)
                } else {
                  updateQuantity(line.id, line.quantity - 1)
                }
              }}
              disabled={isLoading}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            >
              <Minus className="h-3 w-3" />
            </button>
            <span className="w-7 text-center text-sm font-medium" style={{ color: 'var(--color-text)' }}>
              {line.quantity}
            </span>
            <button
              onClick={() => updateQuantity(line.id, line.quantity + 1)}
              disabled={isLoading || line.quantity >= 10}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center hover:bg-[var(--color-surface)] transition-colors disabled:opacity-50"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <span className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
            {formatPrice(line.totalAmount)}
          </span>
        </div>
      </div>
    </div>
  )
}
