import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getAllProductHandles, getProductByHandle, getProducts } from '@/lib/supabase/products'
import { ProductImageGallery } from '@/components/product/ProductImageGallery'
import { ProductInfo } from '@/components/product/ProductInfo'
import { ProductCard } from '@/components/product/ProductCard'
import { RecentlyViewed } from './RecentlyViewed'

interface ProductPageProps {
  params: Promise<{ handle: string }>
}

export async function generateStaticParams() {
  const handles = await getAllProductHandles().catch(() => [])
  return handles.map((handle) => ({ handle }))
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { handle } = await params
  const product = await getProductByHandle(handle).catch(() => null)

  if (!product) return { title: 'Product Not Found' }

  const title = product.seo.title ?? product.title
  const description = product.seo.description ?? product.description.slice(0, 160)
  const image = product.featuredImage?.url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : [],
    },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { handle } = await params
  const product = await getProductByHandle(handle).catch(() => null)

  if (!product) notFound()

  const primaryCollectionHandle = product.collections[0]?.handle
  const relatedResult = primaryCollectionHandle
    ? await getProducts({ collectionHandle: primaryCollectionHandle, first: 5 }).catch(() => null)
    : null

  const relatedProducts = (relatedResult?.products ?? [])
    .filter((p) => p.handle !== product.handle)
    .slice(0, 4)

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16">
        <ProductImageGallery images={product.images} title={product.title} />
        <ProductInfo product={product} />
      </div>

      {relatedProducts.length > 0 && (
        <section className="mt-16 border-t border-[var(--color-divider)] pt-12">
          <h2 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      <RecentlyViewed currentHandle={handle} />
    </div>
  )
}
