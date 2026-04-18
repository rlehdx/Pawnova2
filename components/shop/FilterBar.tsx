'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

const COLLECTIONS = [
  { handle: '', label: 'All Products' },
  { handle: 'dogs', label: 'Dogs' },
  { handle: 'cats', label: 'Cats' },
  { handle: 'new-arrivals', label: 'New Arrivals' },
  { handle: 'sale', label: 'Sale' },
]

const PRICE_RANGES = [
  { label: 'Any Price', min: '', max: '' },
  { label: 'Under $25', min: '', max: '25' },
  { label: '$25 – $50', min: '25', max: '50' },
  { label: '$50 – $100', min: '50', max: '100' },
  { label: '$100+', min: '100', max: '' },
]

export function FilterBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const currentCollection = searchParams.get('collection') ?? ''
  const currentSort = searchParams.get('sort') ?? ''
  const currentMin = searchParams.get('minPrice') ?? ''
  const currentMax = searchParams.get('maxPrice') ?? ''

  const updateParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/shop?${params.toString()}`)
    },
    [router, searchParams]
  )

  const setPriceRange = useCallback(
    (min: string, max: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (min) params.set('minPrice', min)
      else params.delete('minPrice')
      if (max) params.set('maxPrice', max)
      else params.delete('maxPrice')
      router.push(`/shop?${params.toString()}`)
    },
    [router, searchParams]
  )

  return (
    <aside className="w-full space-y-6">
      {/* Collection filter */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Category
        </h3>
        <ul className="space-y-1">
          {COLLECTIONS.map((col) => (
            <li key={col.handle}>
              <button
                onClick={() => updateParam('collection', col.handle)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-[var(--radius-btn)] transition-colors ${
                  currentCollection === col.handle
                    ? 'font-semibold'
                    : 'hover:bg-[var(--color-surface)]'
                }`}
                style={{
                  color: currentCollection === col.handle
                    ? 'var(--color-accent)'
                    : 'var(--color-text)',
                }}
              >
                {col.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Price range */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Price
        </h3>
        <ul className="space-y-1">
          {PRICE_RANGES.map((range) => {
            const isActive = currentMin === range.min && currentMax === range.max
            return (
              <li key={range.label}>
                <button
                  onClick={() => setPriceRange(range.min, range.max)}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-[var(--radius-btn)] transition-colors ${
                    isActive ? 'font-semibold' : 'hover:bg-[var(--color-surface)]'
                  }`}
                  style={{
                    color: isActive ? 'var(--color-accent)' : 'var(--color-text)',
                  }}
                >
                  {range.label}
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Sort — also included here for mobile convenience */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-muted)' }}>
          Sort By
        </h3>
        <ul className="space-y-1">
          {[
            { value: '', label: 'Featured' },
            { value: 'CREATED_AT', label: 'Newest' },
            { value: 'PRICE_ASC', label: 'Price: Low to High' },
            { value: 'PRICE_DESC', label: 'Price: High to Low' },
            { value: 'BEST_SELLING', label: 'Best Selling' },
          ].map((s) => (
            <li key={s.value}>
              <button
                onClick={() => updateParam('sort', s.value)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-[var(--radius-btn)] transition-colors ${
                  currentSort === s.value ? 'font-semibold' : 'hover:bg-[var(--color-surface)]'
                }`}
                style={{
                  color: currentSort === s.value ? 'var(--color-accent)' : 'var(--color-text)',
                }}
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
