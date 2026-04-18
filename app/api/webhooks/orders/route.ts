// Placeholder for future payment webhook (e.g. Stripe)
// When integrating Stripe, implement signature verification here.
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ received: true })
}
