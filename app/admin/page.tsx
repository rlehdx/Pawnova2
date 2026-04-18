import { createAdminClient } from '@/lib/supabase/admin-client'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, Package, ShoppingCart, Mail } from 'lucide-react'

async function getStats() {
  const db = createAdminClient()
  const [ordersRes, productsRes, subscribersRes] = await Promise.all([
    db.from('pawnova_orders').select('total, created_at, customer_email, status, id').order('created_at', { ascending: false }),
    db.from('pawnova_products').select('id', { count: 'exact', head: true }),
    db.from('pawnova_newsletter_subscribers').select('id', { count: 'exact', head: true }),
  ])
  const orders = ordersRes.data ?? []
  const totalRevenue = orders.filter(o => o.status !== 'refunded' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0)

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

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts: productsRes.count ?? 0,
    totalSubscribers: subscribersRes.count ?? 0,
    recentOrders: orders.slice(0, 8),
    revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
  }
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-gray-100 text-gray-700',
  refunded: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.revenue), 1)

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Products', value: String(stats.totalProducts), icon: Package, color: 'text-purple-600' },
    { label: 'Subscribers', value: String(stats.totalSubscribers), icon: Mail, color: 'text-orange-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg bg-gray-50 mb-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue — Last 30 Days</h2>
        <div className="flex items-end gap-0.5 h-32">
          {stats.revenueByDay.map(({ date, revenue }) => (
            <div
              key={date}
              className="flex-1 bg-gray-900 rounded-t"
              style={{ height: `${(revenue / maxRevenue) * 100}%`, minHeight: revenue > 0 ? '4px' : '0' }}
              title={`${date}: ${formatPrice(revenue)}`}
            />
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentOrders.length === 0 && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No orders yet</p>
          )}
          {stats.recentOrders.map(order => (
            <div key={order.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{order.customer_email}</p>
                <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
