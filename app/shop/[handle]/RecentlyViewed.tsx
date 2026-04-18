'use client'

import { useEffect, useState } from 'react'
import { useUIStore } from '@/store/uiStore'
import { ProductCard } from '@/components/product/ProductCard'
import type { Product } from '@/types/database'

interface RecentlyViewedProps {
  currentHandle: string
}

export function RecentlyViewed({ currentHandle }: RecentlyViewedProps) {
  const { recentlyViewed, addRecentlyViewed } = useUIStore()
  const [products, setProducts] = useState<Product[]>([])

  // Track this page view
  useEffect(() => {
    addRecentlyViewed(currentHandle)
  }, [currentHandle, addRecentlyViewed])

  // Fetch recently viewed products
  useEffect(() => {
    const handles = recentlyViewed.filter((h) => h !== currentHandle).slice(0, 4)
    if (handles.length === 0) {
      setProducts([])
      return
    }

    const isValidProduct = (p: unknown): p is Product => {
      if (!p || typeof p !== 'object') return false
      const obj = p as Record<string, unknown>
      return (
        typeof obj.id === 'string' &&
        typeof obj.handle === 'string' &&
        typeof obj.title === 'string' &&
        Array.isArray(obj.images) &&
        Array.isArray(obj.variants)
      )
    }

    Promise.all(
      handles.map((h) =>
        fetch(`/api/products/${h}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null)
      )
    ).then((results) => {
      setProducts(results.filter(isValidProduct))
    })
  }, [recentlyViewed, currentHandle])

  if (products.length === 0) return null

  return (
    <section className="mt-12 border-t border-[var(--color-divider)] pt-10">
      <h2
        className="text-xl font-bold mb-5"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}
      >
        Recently Viewed
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  )
}
