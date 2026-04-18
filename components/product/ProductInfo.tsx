'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Truck, RotateCcw, Shield } from 'lucide-react'
import { AddToCartButton } from './AddToCartButton'
import { Accordion } from '@/components/ui/Accordion'
import { formatPrice } from '@/lib/utils'
import type { Product, ProductVariant } from '@/types/database'

interface ProductInfoProps {
  product: Product
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(
    product.variants[0]
  )
  const [quantity, setQuantity] = useState(1)

  const hasVariants =
    product.variants.length > 1 ||
    (product.variants[0]?.title !== 'Default' && product.variants[0]?.selectedOptions.length > 0)

  const optionNames = hasVariants
    ? [...new Set(product.variants.flatMap((v) => v.selectedOptions.map((o) => o.name)))]
    : []

  const isOnSale =
    selectedVariant.compareAtPrice !== null &&
    selectedVariant.compareAtPrice !== undefined &&
    selectedVariant.compareAtPrice > selectedVariant.price

  const primaryCollection = product.collections[0]

  const accordionItems = [
    {
      title: 'Description',
      content: (
        <div
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: product.descriptionHtml || product.description }}
        />
      ),
    },
    {
      title: 'Shipping Info',
      content: (
        <p>
          Free US shipping on orders over $50. Standard shipping (3–5 business days) $5.99.
          Orders ship within 1–2 business days.
        </p>
      ),
    },
    {
      title: 'Returns',
      content: (
        <p>
          30-day hassle-free returns. If you&apos;re not completely satisfied, contact us and
          we&apos;ll make it right — no questions asked.
        </p>
      ),
    },
    {
      title: 'Sustainability',
      content: (
        <p>
          We&apos;re committed to responsible sourcing and eco-friendly packaging made from
          recycled materials. Carbon emissions are offset on every shipment.
        </p>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-muted)' }} aria-label="Breadcrumb">
        <Link href="/" className="hover:text-[var(--color-accent)] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-[var(--color-accent)] transition-colors">Shop</Link>
        {primaryCollection && (
          <>
            <span>/</span>
            <Link
              href={`/collections/${primaryCollection.handle}`}
              className="hover:text-[var(--color-accent)] transition-colors capitalize"
            >
              {primaryCollection.title}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="line-clamp-1">{product.title}</span>
      </nav>

      {/* Title */}
      <h1
        className="text-2xl md:text-3xl font-black leading-tight"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
      >
        {product.title}
      </h1>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text)' }}
        >
          {formatPrice(selectedVariant.price)}
        </span>
        {isOnSale && selectedVariant.compareAtPrice !== null && (
          <span className="text-lg line-through" style={{ color: 'var(--color-text-muted)' }}>
            {formatPrice(selectedVariant.compareAtPrice)}
          </span>
        )}
      </div>

      {/* Short description */}
      {product.description && (
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
          {product.description.slice(0, 200)}
          {product.description.length > 200 ? '…' : ''}
        </p>
      )}

      {/* Variant selectors */}
      {hasVariants && optionNames.map((optionName) => {
        const optionValues = [
          ...new Set(
            product.variants
              .map((v) => v.selectedOptions.find((o) => o.name === optionName)?.value)
              .filter(Boolean) as string[]
          ),
        ]

        return (
          <div key={optionName}>
            <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              {optionName}:{' '}
              <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>
                {selectedVariant.selectedOptions.find((o) => o.name === optionName)?.value}
              </span>
            </p>
            <div className="flex flex-wrap gap-2">
              {optionValues.map((value) => {
                const matchingVariant = product.variants.find((v) =>
                  v.selectedOptions.some((o) => o.name === optionName && o.value === value)
                )
                const isSelected = selectedVariant.selectedOptions.some(
                  (o) => o.name === optionName && o.value === value
                )
                const isUnavailable = matchingVariant && !matchingVariant.availableForSale

                return (
                  <button
                    key={value}
                    onClick={() => matchingVariant && setSelectedVariant(matchingVariant)}
                    disabled={isUnavailable}
                    className={`px-4 py-2.5 min-h-[44px] text-sm rounded-[var(--radius-btn)] border transition-colors ${
                      isSelected
                        ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-white'
                        : isUnavailable
                        ? 'border-[var(--color-divider)] line-through opacity-40 cursor-not-allowed'
                        : 'border-[var(--color-divider)] hover:border-[var(--color-text-muted)]'
                    }`}
                    style={{ color: isSelected ? 'white' : 'var(--color-text)' }}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Quantity */}
      <div>
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>Quantity</p>
        <div className="inline-flex items-center rounded border border-[var(--color-divider)] overflow-hidden">
          <button
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="flex h-10 w-10 items-center justify-center hover:bg-[var(--color-surface)] transition-colors text-lg"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm font-medium" style={{ color: 'var(--color-text)' }}>
            {quantity}
          </span>
          <button
            onClick={() => setQuantity((q) => Math.min(10, q + 1))}
            className="flex h-10 w-10 items-center justify-center hover:bg-[var(--color-surface)] transition-colors text-lg"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      {/* Add to Cart */}
      <AddToCartButton
        variantId={selectedVariant.id}
        availableForSale={selectedVariant.availableForSale}
        quantity={quantity}
      />

      {/* Trust icons */}
      <div className="flex flex-wrap gap-4 text-xs pt-2" style={{ color: 'var(--color-text-muted)' }}>
        <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Free Shipping $50+</span>
        <span className="flex items-center gap-1"><RotateCcw className="h-3.5 w-3.5" /> 30-Day Returns</span>
        <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Secure Checkout</span>
      </div>

      {/* Accordion */}
      <Accordion items={accordionItems} />
    </div>
  )
}
