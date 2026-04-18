'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'

interface Order {
  id: string
  customer_email: string
  customer_name: string | null
  status: string
  total: number
  subtotal: number
  created_at: string
  stripe_payment_intent: string | null
  order_lines: { title: string; quantity: number; price: number }[]
}

const STATUSES = ['paid','processing','shipped','delivered','refunded','cancelled']
const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-gray-100 text-gray-700',
  refunded: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const res = await fetch('/api/admin/orders')
    const json = await res.json() as { orders: Order[] }
    setOrders(json.orders ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    fetchOrders()
  }

  async function handleRefund(id: string) {
    if (!confirm('Issue full refund via Stripe?')) return
    setUpdating(id)
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'POST' })
    const json = await res.json() as { error?: string }
    if (!res.ok) alert(json.error ?? 'Refund failed')
    setUpdating(null)
    fetchOrders()
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Customer</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
            )}
            {orders.flatMap(order => {
              const rows = [
                <tr key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customer_email}</p>
                    {order.customer_name && <p className="text-xs text-gray-400">{order.customer_name}</p>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2" onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {order.stripe_payment_intent && order.status !== 'refunded' && (
                      <button onClick={() => handleRefund(order.id)} disabled={updating === order.id}
                        className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50 disabled:opacity-50">
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
              ]
              if (expandedId === order.id) {
                rows.push(
                  <tr key={`${order.id}-detail`}>
                    <td colSpan={5} className="px-4 py-3 bg-gray-50">
                      <table className="w-full text-xs">
                        <thead><tr>
                          <th className="text-left text-gray-500 font-medium pb-1">Item</th>
                          <th className="text-left text-gray-500 font-medium pb-1">Qty</th>
                          <th className="text-left text-gray-500 font-medium pb-1">Price</th>
                        </tr></thead>
                        <tbody>{order.order_lines.map((line, i) => (
                          <tr key={i}>
                            <td className="text-gray-700">{line.title}</td>
                            <td className="text-gray-700">{line.quantity}</td>
                            <td className="text-gray-700">{formatPrice(line.price)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </td>
                  </tr>
                )
              }
              return rows
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
