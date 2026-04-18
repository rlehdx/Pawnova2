import { createAdminClient } from '@/lib/supabase/admin-client'
import { ProductForm } from '../ProductForm'

async function getCollections() {
  const db = createAdminClient()
  const { data } = await db.from('pawnova_collections').select('id, title').order('sort_order')
  return data ?? []
}

export default async function NewProductPage() {
  const collections = await getCollections()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h1>
      <ProductForm mode="new" collections={collections} />
    </div>
  )
}
