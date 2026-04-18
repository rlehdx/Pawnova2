import { Suspense } from 'react'
import type { Metadata } from 'next'
import { getProducts } from '@/lib/supabase/products'
import { ProductGrid } from '@/components/product/ProductGrid'
import { FilterBar } from '@/components/shop/FilterBar'
import { SortDropdown } from '@/components/shop/SortDropdown'
import { MobileFilterDrawer } from './MobileFilterDrawer'
import type { SortKey, SortOrder } from '@/types/database'

export const metadata: Metadata = {
  title: 'Shop All Pet Supplies',
  description: 'Browse our full collection of premium pet wellness accessories for dogs and cats.',
}

interface ShopPageProps {
  searchParams: Promise<{
    sort?: string
    collection?: string
    minPrice?: string
    maxPrice?: string
  }>
}

function parseSortKey(sort?: string): { sortKey: SortKey; sortOrder: SortOrder } {
  switch (sort) {
    case 'PRICE_ASC':  return { sortKey: 'price', sortOrder: 'asc' }
    case 'PRICE_DESC': return { sortKey: 'price', sortOrder: 'desc' }
    case 'CREATED_AT': return { sortKey: 'created_at', sortOrder: 'desc' }
    case 'TITLE':      return { sortKey: 'title', sortOrder: 'asc' }
    default:           return { sortKey: 'created_at', sortOrder: 'desc' }
  }
}

async function ProductResults({
  sort,
  collection,
  minPrice,
  maxPrice,
}: {
  sort?: string
  collection?: string
  minPrice?: string
  maxPrice?: string
}) {
  const { sortKey, sortOrder } = parseSortKey(sort)

  const result = await getProducts({
    first: 24,
    sortKey,
    sortOrder,
    collectionHandle: collection,
    minPrice: minPrice ? parseFloat(minPrice) : undefined,
    maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
  }).catch(() => ({ products: [], total: 0, hasNextPage: false }))

  return <ProductGrid products={result.products} />
}

export default async function ShopPage({ searchParams }: ShopPageProps) {
  const params = await searchParams
  const pageTitle = params.collection
    ? params.collection.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'All Products'

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          {pageTitle}
        </h1>
        <div className="flex items-center gap-3">
          <Suspense>
            <MobileFilterDrawer />
          </Suspense>
          <div className="hidden md:block">
            <Suspense>
              <SortDropdown />
            </Suspense>
          </div>
        </div>
      </div>

      <div className="flex gap-10">
        <aside className="hidden md:block w-60 flex-shrink-0 sticky top-24 self-start">
          <Suspense>
            <FilterBar />
          </Suspense>
        </aside>

        <div className="flex-1">
          <Suspense fallback={<ProductGrid products={[]} isLoading skeletonCount={24} />}>
            <ProductResults
              sort={params.sort}
              collection={params.collection}
              minPrice={params.minPrice}
              maxPrice={params.maxPrice}
            />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
