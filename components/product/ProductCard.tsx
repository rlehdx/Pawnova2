'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart, isLoading } = useCart()
  const [wishlisted, setWishlisted] = useState(false)

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

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setWishlisted((prev) => !prev)
  }

  const categoryLabel = product.collections[0]?.title ?? null

  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-divider)] hover:border-[var(--color-accent)] hover:-translate-y-1 transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)')
      }
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

        {/* Sale badge */}
        {hasDiscount && (
          <span
            className="absolute top-2.5 left-2.5 inline-flex items-center rounded px-2 py-0.5 text-xs font-black text-white"
            style={{ backgroundColor: 'var(--color-badge-sale)' }}
          >
            -{discountPct}%
          </span>
        )}

        {/* Wishlist button — always visible on touch, hover-only on desktop */}
        <button
          onClick={handleWishlist}
          className="absolute top-2 right-2 flex h-10 w-10 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 [@media(hover:none)]:opacity-100 transition-opacity duration-200"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart
            className="h-4 w-4 transition-colors duration-200"
            style={{
              color: wishlisted ? 'var(--color-accent)' : 'var(--color-text-muted)',
              fill: wishlisted ? 'var(--color-accent)' : 'none',
            }}
          />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Category label */}
        {categoryLabel && (
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {categoryLabel}
          </p>
        )}

        {/* Title */}
        <p
          className="text-sm font-bold leading-snug line-clamp-2 flex-1"
          style={{ color: 'var(--color-text)' }}
        >
          {product.title}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black" style={{ color: 'var(--color-text)' }}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>

        {/* CTA — pill button */}
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-black tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
            boxShadow: 'var(--shadow-btn)',
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
