import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

function makeClient() {
  const cookieStore = cookies() as unknown as Awaited<ReturnType<typeof cookies>>
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )
}

// GET /api/account/wishlist — list user's wishlist product IDs
export async function GET() {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase
    .from('pawnova_wishlists')
    .select('product_id')
    .eq('user_id', user.id)

  return NextResponse.json({ productIds: (data ?? []).map(r => r.product_id) })
}

// POST /api/account/wishlist — toggle (add/remove)
export async function POST(request: NextRequest) {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { productId } = await request.json() as { productId: string }

  const { data: existing } = await supabase
    .from('pawnova_wishlists')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .single()

  if (existing) {
    await supabase.from('pawnova_wishlists').delete().eq('id', existing.id)
    return NextResponse.json({ wishlisted: false })
  } else {
    await supabase.from('pawnova_wishlists').insert({ user_id: user.id, product_id: productId })
    return NextResponse.json({ wishlisted: true })
  }
}
