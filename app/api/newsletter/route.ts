import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email: string }
    const { email } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 })
    }

    const supabase = createServerClient()

    const { error } = await supabase
      .from('pawnova_newsletter_subscribers')
      .insert({ email: email.toLowerCase().trim() })

    if (error) {
      // 23505 = unique_violation (already subscribed)
      if (error.code === '23505') {
        return NextResponse.json({ success: true })
      }
      throw new Error(error.message)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Newsletter signup failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
