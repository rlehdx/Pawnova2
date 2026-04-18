import { NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

export async function GET() {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()

    const [ordersRes, productsRes, subscribersRes] = await Promise.all([
      db.from('pawnova_orders').select('total, created_at, customer_email, status, id').order('created_at', { ascending: false }),
      db.from('pawnova_products').select('id', { count: 'exact', head: true }),
      db.from('pawnova_newsletter_subscribers').select('id', { count: 'exact', head: true }),
    ])

    const orders = ordersRes.data ?? []
    const totalRevenue = orders.filter(o => o.status !== 'refunded' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0)
    const totalOrders = orders.length

    const now = new Date()
    const revenueByDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      revenueByDay[d.toISOString().slice(0, 10)] = 0
    }
    orders.forEach(o => {
      const day = o.created_at.slice(0, 10)
      if (day in revenueByDay && o.status !== 'refunded' && o.status !== 'cancelled') {
        revenueByDay[day] += Number(o.total)
      }
    })

    const recentOrders = orders.slice(0, 10).map(o => ({
      id: o.id,
      customer_email: o.customer_email,
      total: o.total,
      status: o.status,
      created_at: o.created_at,
    }))

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts: productsRes.count ?? 0,
      totalSubscribers: subscribersRes.count ?? 0,
      revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
      recentOrders,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
