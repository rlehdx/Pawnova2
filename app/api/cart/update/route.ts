import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { updateCartLine } from '@/lib/supabase/cart'

const SESSION_COOKIE = 'pawnova_session'

export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      lineId: string
      quantity: number
    }

    const { lineId, quantity } = body

    if (!lineId || typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: 'lineId required; quantity must be a positive integer' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 400 })
    }

    const cart = await updateCartLine(sessionId, lineId, quantity)
    return NextResponse.json({ cart })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update cart'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
