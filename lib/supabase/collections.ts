import { createServerClient } from './client'
import { getProducts } from './products'
import type { Collection, Product, DbCollection } from '@/types/database'

function normalizeCollection(c: DbCollection): Collection {
  return {
    id: c.id,
    handle: c.handle,
    title: c.title,
    description: c.description,
    image: c.image_url ? { url: c.image_url, altText: c.image_alt } : null,
    seo: { title: c.seo_title, description: c.seo_description },
  }
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pawnova_collections')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (error) throw new Error(`Failed to fetch collections: ${error.message}`)
  return (data ?? []).map(normalizeCollection)
}

export async function getCollection(
  handle: string
): Promise<(Collection & { products: Product[] }) | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('pawnova_collections')
    .select('*')
    .eq('handle', handle)
    .eq('is_active', true)
    .single()

  if (error || !data) return null

  const result = await getProducts({ collectionHandle: handle, first: 48 })

  return {
    ...normalizeCollection(data as DbCollection),
    products: result.products,
  }
}

export async function getAllCollectionHandles(): Promise<string[]> {
  const collections = await getCollections().catch(() => [])
  return collections.map((c) => c.handle)
}
