import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllCollectionHandles, getCollection } from '@/lib/supabase/collections'
import { ProductCard } from '@/components/product/ProductCard'

interface CollectionPageProps {
  params: Promise<{ handle: string }>
}

export async function generateStaticParams() {
  const handles = await getAllCollectionHandles().catch(() => [])
  return handles.map((handle) => ({ handle }))
}

export async function generateMetadata({ params }: CollectionPageProps): Promise<Metadata> {
  const { handle } = await params
  const collection = await getCollection(handle).catch(() => null)

  if (!collection) return { title: 'Collection Not Found' }

  return {
    title: collection.seo.title ?? collection.title,
    description: collection.seo.description ?? collection.description ?? undefined,
    openGraph: {
      title: collection.seo.title ?? collection.title,
      images: collection.image ? [{ url: collection.image.url }] : [],
    },
  }
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  const { handle } = await params
  const collection = await getCollection(handle).catch(() => null)

  if (!collection) notFound()

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          {collection.title}
        </h1>
        {collection.description && (
          <p className="mt-2 text-sm leading-relaxed max-w-2xl" style={{ color: 'var(--color-text-muted)' }}>
            {collection.description}
          </p>
        )}
      </div>

      {collection.products.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>
            No products in this collection yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {collection.products.map((product, i) => (
            <ProductCard key={product.id} product={product} priority={i < 4} />
          ))}
        </div>
      )}
    </div>
  )
}
