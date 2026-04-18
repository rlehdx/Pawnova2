import { type NextRequest, NextResponse } from 'next/server'
import { getProductByHandle } from '@/lib/supabase/products'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  const { handle } = await params
  try {
    const product = await getProductByHandle(handle)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json(product, {
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch product'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
