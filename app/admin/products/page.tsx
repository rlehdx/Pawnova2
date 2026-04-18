import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { formatPrice } from '@/lib/utils'
import { Plus } from 'lucide-react'

async function getProducts() {
  const db = createAdminClient()
  const { data } = await db
    .from('pawnova_products')
    .select('id, handle, title, is_active, created_at, product_variants(price), product_images(url, sort_order)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Product</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Price</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No products yet</td></tr>
            )}
            {products.map(product => {
              const variants = product.product_variants as { price: number }[]
              const images = product.product_images as { url: string; sort_order: number }[]
              const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)
              const minPrice = variants.length ? Math.min(...variants.map(v => v.price)) : 0
              return (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {sortedImages[0] && (
                        <img src={sortedImages[0].url} alt={product.title} className="h-10 w-10 object-cover rounded-lg" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.title}</p>
                        <p className="text-xs text-gray-400">{product.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatPrice(minPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${product.id}`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
