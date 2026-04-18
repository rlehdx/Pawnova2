import { createAdminClient } from '@/lib/supabase/admin-client'
import { ProductForm } from '../ProductForm'
import { notFound } from 'next/navigation'

async function getProduct(id: string) {
  const db = createAdminClient()
  const { data } = await db
    .from('pawnova_products')
    .select('*, product_images(*), product_variants(*), product_collections(collection_id)')
    .eq('id', id)
    .single()
  return data
}

async function getCollections() {
  const db = createAdminClient()
  const { data } = await db.from('pawnova_collections').select('id, title').order('sort_order')
  return data ?? []
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, collections] = await Promise.all([getProduct(id), getCollections()])
  if (!product) notFound()

  const images = (product.product_images as { url: string; alt_text: string | null; sort_order: number }[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(img => ({ url: img.url, alt_text: img.alt_text ?? '' }))

  const variants = (product.product_variants as {
    id: string; title: string; price: number; compare_at_price: number | null;
    sku: string | null; inventory_quantity: number; option1_name: string | null; option1_value: string | null;
  }[]).map(v => ({
    id: v.id,
    title: v.title,
    price: String(v.price),
    compare_at_price: v.compare_at_price != null ? String(v.compare_at_price) : '',
    sku: v.sku ?? '',
    inventory_quantity: String(v.inventory_quantity),
    option1_name: v.option1_name ?? '',
    option1_value: v.option1_value ?? '',
  }))

  const collectionIds = (product.product_collections as { collection_id: string }[]).map(pc => pc.collection_id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
      <ProductForm
        mode="edit"
        productId={id}
        collections={collections}
        initialData={{
          title: product.title,
          handle: product.handle,
          description: product.description ?? '',
          description_html: product.description_html ?? '',
          tags: (product.tags as string[]).join(', '),
          is_active: product.is_active,
          seo_title: product.seo_title ?? '',
          seo_description: product.seo_description ?? '',
          images,
          variants,
          collection_ids: collectionIds,
        }}
      />
    </div>
  )
}
