import { NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

export async function GET() {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const { data, error } = await db
      .from('pawnova_orders')
      .select('*, order_lines(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ orders: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
