import { type NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/client'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutComplete(session)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const db = createServerClient()
  const stripe = getStripe()

  const pawnova_session_id = session.metadata?.pawnova_session_id
  const user_id = session.metadata?.user_id ?? null

  let cartLines: {
    title: string
    variant_title: string | null
    price: number
    quantity: number
    product_id: string | null
    variant_id: string | null
    image_url: string | null
  }[] = []

  if (pawnova_session_id) {
    const { data: cart } = await db.from('pawnova_carts').select('id').eq('session_id', pawnova_session_id).single()
    if (cart) {
      const { data: lines } = await db
        .from('pawnova_cart_lines')
        .select(`
          quantity,
          pawnova_product_variants (
            id, title, price, product_id,
            pawnova_products (id, title),
            image_url
          )
        `)
        .eq('cart_id', cart.id)

      cartLines = (lines ?? []).map((line: Record<string, unknown>) => {
        const variant = line.pawnova_product_variants as Record<string, unknown>
        const product = variant?.pawnova_products as Record<string, unknown> | null
        return {
          title: (product?.title as string) ?? 'Product',
          variant_title: (variant?.title as string) ?? null,
          price: (variant?.price as number) ?? 0,
          quantity: line.quantity as number,
          product_id: (product?.id as string) ?? null,
          variant_id: (variant?.id as string) ?? null,
          image_url: (variant?.image_url as string) ?? null,
        }
      })
    }
  }

  const { data: order } = await db.from('pawnova_orders').insert({
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    customer_email: session.customer_details?.email ?? '',
    customer_name: session.customer_details?.name ?? null,
    status: 'paid',
    subtotal: (session.amount_subtotal ?? 0) / 100,
    total: (session.amount_total ?? 0) / 100,
    shipping_address: (session as unknown as { shipping_details?: { address?: Record<string, string> } }).shipping_details?.address ?? null,
    ...(user_id ? { user_id } : {}),
  }).select().single()

  if (order && cartLines.length) {
    await db.from('pawnova_order_lines').insert(
      cartLines.map(line => ({
        order_id: order.id,
        product_id: line.product_id,
        variant_id: line.variant_id,
        title: line.title,
        variant_title: line.variant_title,
        quantity: line.quantity,
        price: line.price,
        image_url: line.image_url,
      }))
    )
  }

  if (pawnova_session_id) {
    const { data: cart } = await db.from('pawnova_carts').select('id').eq('session_id', pawnova_session_id).single()
    if (cart) {
      await db.from('pawnova_cart_lines').delete().eq('cart_id', cart.id)
    }
  }
}
