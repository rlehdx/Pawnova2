import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { addCartLine } from '@/lib/supabase/cart'

const SESSION_COOKIE = 'pawnova_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      variantId: string
      quantity?: number
    }

    const { variantId, quantity = 1 } = body

    if (!variantId || typeof variantId !== 'string') {
      return NextResponse.json({ error: 'variantId is required' }, { status: 400 })
    }

    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json({ error: 'quantity must be a positive integer' }, { status: 400 })
    }

    const cookieStore = await cookies()
    let sessionId = cookieStore.get(SESSION_COOKIE)?.value
    if (!sessionId) {
      sessionId = uuidv4()
    }

    const cart = await addCartLine(sessionId, variantId, quantity)

    const response = NextResponse.json({ cart })
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to add to cart'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
