'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart, isLoading } = useCart()

  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const variantId = product.variants[0]?.id
    if (!variantId) return
    addToCart(variantId, 1)
  }

  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-divider)] hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 transition-all duration-200"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-2)' }}
      >
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            No image
          </div>
        )}

        {hasDiscount && (
          <span
            className="absolute top-2.5 left-2.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--color-badge-sale)' }}
          >
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Stars — display placeholder (no rating in DB) */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-3 w-3"
              style={{ fill: 'var(--color-accent)', color: 'var(--color-accent)' }}
            />
          ))}
          <span className="ml-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            (4.9)
          </span>
        </div>

        {/* Title */}
        <p
          className="text-sm font-semibold leading-snug line-clamp-2 flex-1"
          style={{ color: 'var(--color-text)' }}
        >
          {product.title}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>

        {/* CTA — always visible */}
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-accent)')
          }
        >
          <ShoppingCart className="h-4 w-4" />
          {isLoading ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}
