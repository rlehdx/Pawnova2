import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'
import Stripe from 'stripe'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const { status } = await request.json() as { status: string }
    const { error } = await db.from('pawnova_orders').update({ status }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(_request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()

    const { data: order, error } = await db
      .from('pawnova_orders')
      .select('stripe_payment_intent, total')
      .eq('id', id)
      .single()
    if (error || !order) throw new Error('Order not found')
    if (!order.stripe_payment_intent) throw new Error('No payment intent on this order')

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    await stripe.refunds.create({ payment_intent: order.stripe_payment_intent })

    await db.from('pawnova_orders').update({ status: 'refunded' }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
