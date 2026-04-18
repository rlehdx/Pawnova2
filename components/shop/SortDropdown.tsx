'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'CREATED_AT', label: 'Newest' },
  { value: 'PRICE_ASC', label: 'Price: Low to High' },
  { value: 'PRICE_DESC', label: 'Price: High to Low' },
  { value: 'BEST_SELLING', label: 'Best Selling' },
]

export function SortDropdown() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const currentSort = searchParams.get('sort') ?? ''

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value) {
      params.set('sort', e.target.value)
    } else {
      params.delete('sort')
    }
    router.push(`/shop?${params.toString()}`)
  }

  return (
    <div className="relative">
      <select
        value={currentSort}
        onChange={handleChange}
        className="appearance-none h-9 rounded-[var(--radius-btn)] border border-[var(--color-divider)] bg-[var(--color-surface)] pl-3 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        style={{ color: 'var(--color-text)' }}
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
    </div>
  )
}
