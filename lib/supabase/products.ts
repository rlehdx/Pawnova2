import { createServerClient } from './client'
import type {
  Product,
  ProductImage,
  ProductVariant,
  Collection,
  SelectedOption,
  GetProductsOptions,
  ProductsResult,
  DbProduct,
  DbProductImage,
  DbProductVariant,
  DbCollection,
} from '@/types/database'

// ─── Normalizers ──────────────────────────────────────────────────────────────

function normalizeImage(img: DbProductImage): ProductImage {
  return {
    id: img.id,
    url: img.url,
    altText: img.alt_text,
    width: img.width,
    height: img.height,
  }
}

function normalizeVariant(v: DbProductVariant): ProductVariant {
  const selectedOptions: SelectedOption[] = []
  if (v.option1_name && v.option1_value) {
    selectedOptions.push({ name: v.option1_name, value: v.option1_value })
  }
  if (v.option2_name && v.option2_value) {
    selectedOptions.push({ name: v.option2_name, value: v.option2_value })
  }

  return {
    id: v.id,
    title: v.title,
    price: v.price,
    compareAtPrice: v.compare_at_price,
    sku: v.sku,
    inventoryQuantity: v.inventory_quantity,
    availableForSale: v.available_for_sale && v.inventory_quantity > 0,
    selectedOptions,
    image: v.image_url ? { url: v.image_url, altText: v.image_alt } : null,
  }
}

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

function assembleProduct(
  product: DbProduct,
  images: DbProductImage[],
  variants: DbProductVariant[],
  collections: DbCollection[]
): Product {
  const normalizedImages = images.map(normalizeImage)
  const normalizedVariants = variants.map(normalizeVariant)
  const normalizedCollections = collections.map(normalizeCollection)

  const prices = variants.map((v) => v.price)
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0

  const comparePrices = variants
    .map((v) => v.compare_at_price)
    .filter((p): p is number => p !== null)
  const minCompareAt = comparePrices.length > 0 ? Math.min(...comparePrices) : null

  const isOnSale = minCompareAt !== null && minCompareAt > minPrice
  const availableForSale = normalizedVariants.some((v) => v.availableForSale)

  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description ?? '',
    descriptionHtml: product.description_html ?? product.description ?? '',
    price: minPrice,
    compareAtPrice: isOnSale ? minCompareAt : null,
    images: normalizedImages,
    variants: normalizedVariants,
    tags: product.tags ?? [],
    collections: normalizedCollections,
    seo: { title: product.seo_title, description: product.seo_description },
    featuredImage: normalizedImages[0] ?? null,
    isOnSale,
    availableForSale,
  }
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getProducts({
  first = 24,
  after,
  sortKey = 'created_at',
  sortOrder = 'desc',
  collectionHandle,
  minPrice,
  maxPrice,
  query,
}: GetProductsOptions = {}): Promise<ProductsResult> {
  const supabase = createServerClient()

  // Resolve collection filter
  let collectionProductIds: string[] | null = null
  if (collectionHandle) {
    const { data: col } = await supabase
      .from('pawnova_collections')
      .select('id')
      .eq('handle', collectionHandle)
      .eq('is_active', true)
      .single()

    if (col) {
      const { data: pcRows } = await supabase
        .from('pawnova_product_collections')
        .select('product_id')
        .eq('collection_id', col.id)
      collectionProductIds = (pcRows ?? []).map((r) => r.product_id)
    }
  }

  // Build product query
  let productQuery = supabase
    .from('pawnova_products')
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  if (collectionProductIds !== null) {
    if (collectionProductIds.length === 0) {
      return { products: [], total: 0, hasNextPage: false }
    }
    productQuery = productQuery.in('id', collectionProductIds)
  }

  if (query) {
    productQuery = productQuery.ilike('title', `%${query}%`)
  }

  // Pagination via range
  const pageSize = first
  const offset = after ? parseInt(after, 10) : 0

  // Sort
  const ascending = sortOrder === 'asc'
  if (sortKey === 'title') {
    productQuery = productQuery.order('title', { ascending })
  } else {
    productQuery = productQuery.order('created_at', { ascending })
  }

  productQuery = productQuery.range(offset, offset + pageSize - 1)

  const { data: productRows, count, error } = await productQuery

  if (error) throw new Error(`Failed to fetch products: ${error.message}`)
  if (!productRows || productRows.length === 0) {
    return { products: [], total: count ?? 0, hasNextPage: false }
  }

  const productIds = productRows.map((p) => p.id)

  // Fetch related data in parallel
  const [imagesRes, variantsRes, collectionsRes] = await Promise.all([
    supabase
      .from('pawnova_product_images')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('pawnova_product_variants')
      .select('*')
      .in('product_id', productIds)
      .order('sort_order', { ascending: true }),
    supabase
      .from('pawnova_product_collections')
      .select('product_id, pawnova_collections(*)')
      .in('product_id', productIds),
  ])

  const imagesByProduct = groupBy(imagesRes.data ?? [], 'product_id')
  const variantsByProduct = groupBy(variantsRes.data ?? [], 'product_id')

  // Price filter (post-query on variants)
  const collectionsByProduct: Record<string, DbCollection[]> = {}
  ;(collectionsRes.data ?? []).forEach((row: { product_id: string; pawnova_collections: DbCollection | DbCollection[] | null }) => {
    if (!collectionsByProduct[row.product_id]) {
      collectionsByProduct[row.product_id] = []
    }
    if (row.pawnova_collections) {
      const cols = Array.isArray(row.pawnova_collections) ? row.pawnova_collections : [row.pawnova_collections]
      collectionsByProduct[row.product_id].push(...cols)
    }
  })

  let products = productRows.map((p) =>
    assembleProduct(
      p as DbProduct,
      (imagesByProduct[p.id] ?? []) as DbProductImage[],
      (variantsByProduct[p.id] ?? []) as DbProductVariant[],
      collectionsByProduct[p.id] ?? []
    )
  )

  // Price range filter
  if (minPrice !== undefined) {
    products = products.filter((p) => p.price >= minPrice!)
  }
  if (maxPrice !== undefined) {
    products = products.filter((p) => p.price <= maxPrice!)
  }

  // Sort by price if requested (done client-side after assembly)
  if (sortKey === 'price') {
    products.sort((a, b) => ascending ? a.price - b.price : b.price - a.price)
  }

  const total = count ?? 0
  const hasNextPage = offset + pageSize < total

  return { products, total, hasNextPage }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  const supabase = createServerClient()

  const { data: product, error } = await supabase
    .from('pawnova_products')
    .select('*')
    .eq('handle', handle)
    .eq('is_active', true)
    .single()

  if (error || !product) return null

  const [imagesRes, variantsRes, collectionsRes] = await Promise.all([
    supabase
      .from('pawnova_product_images')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('pawnova_product_variants')
      .select('*')
      .eq('product_id', product.id)
      .order('sort_order', { ascending: true }),
    supabase
      .from('pawnova_product_collections')
      .select('pawnova_collections(*)')
      .eq('product_id', product.id),
  ])

  const collections = (collectionsRes.data ?? [])
    .map((r: { pawnova_collections: DbCollection | DbCollection[] | null }) => r.pawnova_collections)
    .flat()
    .filter((c): c is DbCollection => c !== null)

  return assembleProduct(
    product as DbProduct,
    (imagesRes.data ?? []) as DbProductImage[],
    (variantsRes.data ?? []) as DbProductVariant[],
    collections
  )
}

export async function getAllProductHandles(): Promise<string[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('pawnova_products')
    .select('handle')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(50)
  return (data ?? []).map((p) => p.handle)
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function groupBy<T extends Record<string, unknown>>(
  items: T[],
  key: keyof T
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const k = String(item[key])
    if (!acc[k]) acc[k] = []
    acc[k].push(item)
    return acc
  }, {})
}
