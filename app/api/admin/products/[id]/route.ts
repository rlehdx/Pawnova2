import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const { data, error } = await db
      .from('pawnova_products')
      .select(`
        *,
        product_images (*),
        product_variants (*),
        product_collections (collection_id)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const body = await request.json() as {
      title?: string
      description?: string
      description_html?: string
      tags?: string[]
      is_active?: boolean
      seo_title?: string
      seo_description?: string
      images?: { id?: string; url: string; alt_text?: string; sort_order?: number }[]
      variants?: {
        id?: string
        title: string
        price: number
        compare_at_price?: number | null
        sku?: string
        inventory_quantity?: number
        option1_name?: string | null
        option1_value?: string | null
        option2_name?: string | null
        option2_value?: string | null
        image_url?: string | null
      }[]
      collection_ids?: string[]
    }

    const { images, variants, collection_ids, ...productData } = body

    const { error: pErr } = await db.from('pawnova_products').update(productData).eq('id', id)
    if (pErr) throw pErr

    if (images !== undefined) {
      await db.from('pawnova_product_images').delete().eq('product_id', id)
      if (images.length) {
        await db.from('pawnova_product_images').insert(
          images.map((img, i) => ({
            url: img.url,
            alt_text: img.alt_text,
            sort_order: img.sort_order ?? i,
            product_id: id,
          }))
        )
      }
    }

    if (variants !== undefined) {
      await db.from('pawnova_product_variants').delete().eq('product_id', id)
      if (variants.length) {
        await db.from('pawnova_product_variants').insert(
          variants.map((v, i) => ({ ...v, id: undefined, product_id: id, sort_order: i }))
        )
      }
    }

    if (collection_ids !== undefined) {
      await db.from('pawnova_product_collections').delete().eq('product_id', id)
      if (collection_ids.length) {
        await db.from('pawnova_product_collections').insert(
          collection_ids.map(cid => ({ product_id: id, collection_id: cid }))
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const { error } = await db.from('pawnova_products').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
