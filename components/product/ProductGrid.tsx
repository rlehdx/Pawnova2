import { ProductCard } from './ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import type { Product } from '@/types/database'

interface ProductGridProps {
  products: Product[]
  isLoading?: boolean
  skeletonCount?: number
}

export function ProductGrid({ products, isLoading, skeletonCount = 8 }: ProductGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
          No products found
        </p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Try adjusting your filters.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product, i) => (
        <ProductCard key={product.id} product={product} priority={i < 4} />
      ))}
    </div>
  )
}
