import { NextResponse } from 'next/server'
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

export async function GET() {
  const supabase = makeClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: orders } = await supabase
    .from('pawnova_orders')
    .select(`
      id, stripe_session_id, status, subtotal, total, created_at,
      pawnova_order_lines (
        id, title, variant_title, quantity, price, image_url, product_id, variant_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ orders: orders ?? [] })
}
