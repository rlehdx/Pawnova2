import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getCartBySessionId } from '@/lib/supabase/cart'
import { getStripe } from '@/lib/stripe'

const SESSION_COOKIE = 'pawnova_session'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value

    // Get logged-in user id if available
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll() {},
        },
      }
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!sessionId) {
      return NextResponse.json({ error: 'No cart session' }, { status: 400 })
    }

    const cart = await getCartBySessionId(sessionId)
    if (!cart || cart.lines.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const stripe = getStripe()
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: cart.lines.map(line => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: line.productTitle,
            description: line.variantTitle !== 'Default' ? line.variantTitle : undefined,
            images: line.image ? [line.image.url] : [],
          },
          unit_amount: Math.round(line.price * 100),
        },
        quantity: line.quantity,
      })),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: {
        pawnova_session_id: sessionId,
        ...(user?.id ? { user_id: user.id } : {}),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
