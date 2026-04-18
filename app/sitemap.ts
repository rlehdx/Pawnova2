import type { MetadataRoute } from 'next'
import { getAllProductHandles } from '@/lib/supabase/products'
import { getAllCollectionHandles } from '@/lib/supabase/collections'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://pawnova.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [productHandles, collectionHandles] = await Promise.all([
    getAllProductHandles().catch(() => []),
    getAllCollectionHandles().catch(() => []),
  ])

  return [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/shop`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    ...collectionHandles.map((handle) => ({
      url: `${BASE_URL}/collections/${handle}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
    ...productHandles.map((handle) => ({
      url: `${BASE_URL}/shop/${handle}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
  ]
}
