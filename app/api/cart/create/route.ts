import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'
import { getCartBySessionId, createCart } from '@/lib/supabase/cart'

const SESSION_COOKIE = 'pawnova_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

// GET: return current cart for this session
export async function GET(_request: NextRequest) {
  const cookieStore = await cookies()
  const sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) {
    return NextResponse.json({ cart: null })
  }

  try {
    const cart = await getCartBySessionId(sessionId)
    return NextResponse.json({ cart })
  } catch {
    return NextResponse.json({ cart: null })
  }
}

// POST: create a new cart (generates session if needed)
export async function POST(_request: NextRequest) {
  const cookieStore = await cookies()
  let sessionId = cookieStore.get(SESSION_COOKIE)?.value

  if (!sessionId) {
    sessionId = uuidv4()
  }

  try {
    // If a cart already exists for this session, return it
    const existing = await getCartBySessionId(sessionId)
    if (existing) {
      const response = NextResponse.json({ cart: existing })
      response.cookies.set(SESSION_COOKIE, sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: COOKIE_MAX_AGE,
        path: '/',
      })
      return response
    }

    const cart = await createCart(sessionId)
    const response = NextResponse.json({ cart })
    response.cookies.set(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/',
    })
    return response
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create cart'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
