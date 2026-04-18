import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function GET() {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const { data: products, error } = await db
      .from('pawnova_products')
      .select(`
        id, handle, title, is_active, created_at, updated_at,
        product_variants (id, price, inventory_quantity),
        product_images (id, url, sort_order)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ products })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const body = await request.json() as {
      handle: string
      title: string
      description?: string
      description_html?: string
      tags?: string[]
      seo_title?: string
      seo_description?: string
      is_active?: boolean
      images?: { url: string; alt_text?: string; sort_order?: number }[]
      variants: {
        title: string
        price: number
        compare_at_price?: number
        sku?: string
        inventory_quantity?: number
        option1_name?: string
        option1_value?: string
        option2_name?: string
        option2_value?: string
        image_url?: string
      }[]
      collection_ids?: string[]
    }

    const { images, variants, collection_ids, ...productData } = body

    const { data: product, error: pErr } = await db
      .from('pawnova_products')
      .insert({ ...productData, is_active: productData.is_active ?? true })
      .select()
      .single()

    if (pErr) throw pErr

    if (images?.length) {
      await db.from('pawnova_product_images').insert(
        images.map((img, i) => ({ ...img, product_id: product.id, sort_order: i }))
      )
    }

    if (variants?.length) {
      await db.from('pawnova_product_variants').insert(
        variants.map((v, i) => ({ ...v, product_id: product.id, sort_order: i }))
      )
    }

    if (collection_ids?.length) {
      await db.from('pawnova_product_collections').insert(
        collection_ids.map(cid => ({ product_id: product.id, collection_id: cid }))
      )
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
