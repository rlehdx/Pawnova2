import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { removeCartLine } from '@/lib/supabase/cart'

const SESSION_COOKIE = 'pawnova_session'

export async function DELETE(request: NextRequest) {
  try {
    const body = (await request.json()) as { lineId: string }
    const { lineId } = body

    if (!lineId) {
      return NextResponse.json({ error: 'lineId is required' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value

    if (!sessionId) {
      return NextResponse.json({ error: 'No session found' }, { status: 400 })
    }

    const cart = await removeCartLine(sessionId, lineId)
    return NextResponse.json({ cart })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to remove from cart'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
