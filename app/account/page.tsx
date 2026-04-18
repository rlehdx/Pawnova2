'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { User } from '@supabase/supabase-js'
import { Package, Heart, MapPin, Plus, Trash2, Star, ShoppingBag } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { formatPrice } from '@/lib/utils'

interface OrderLine {
  id: string
  title: string
  variant_title: string | null
  quantity: number
  price: number
  image_url: string | null
  product_id: string | null
  variant_id: string | null
}

interface Order {
  id: string
  stripe_session_id: string
  status: string
  subtotal: number
  total: number
  created_at: string
  pawnova_order_lines: OrderLine[]
}

interface Address {
  id: string
  label: string | null
  full_name: string
  line1: string
  line2: string | null
  city: string
  state: string | null
  postal_code: string
  country: string
  is_default: boolean
}

type Tab = 'orders' | 'wishlist' | 'addresses'

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null)
  const [tab, setTab] = useState<Tab>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [wishlistIds, setWishlistIds] = useState<string[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddressForm, setShowAddressForm] = useState(false)
  const [addressForm, setAddressForm] = useState({
    full_name: '', line1: '', line2: '', city: '', state: '',
    postal_code: '', country: 'US', label: '', is_default: false,
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user) return
    setLoading(true)
    Promise.all([
      fetch('/api/account/orders').then(r => r.json()) as Promise<{ orders: Order[] }>,
      fetch('/api/account/wishlist').then(r => r.json()) as Promise<{ productIds: string[] }>,
      fetch('/api/account/addresses').then(r => r.json()) as Promise<{ addresses: Address[] }>,
    ]).then(([o, w, a]) => {
      setOrders(o.orders ?? [])
      setWishlistIds(w.productIds ?? [])
      setAddresses(a.addresses ?? [])
      setLoading(false)
    })
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  // Check hash on mount for tab switching from header
  useEffect(() => {
    const hash = window.location.hash
    if (hash === '#wishlist') setTab('wishlist')
    else if (hash === '#addresses') setTab('addresses')
  }, [])

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/account` },
    })
  }

  const handleDeleteAddress = async (id: string) => {
    await fetch('/api/account/addresses', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setAddresses(prev => prev.filter(a => a.id !== id))
  }

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch('/api/account/addresses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(addressForm),
    })
    const json = await res.json() as { address?: Address; error?: string }
    if (json.address) {
      setAddresses(prev => [...prev, json.address!])
      setShowAddressForm(false)
      setAddressForm({ full_name: '', line1: '', line2: '', city: '', state: '', postal_code: '', country: 'US', label: '', is_default: false })
    } else {
      alert(json.error ?? 'Failed to save address')
    }
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4">
        <ShoppingBag className="h-12 w-12" style={{ color: 'var(--color-text-muted)' }} />
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>My Account</h1>
        <p style={{ color: 'var(--color-text-muted)' }}>Sign in to view your orders, wishlist, and addresses.</p>
        <button
          onClick={handleSignIn}
          className="px-6 py-2.5 rounded-[var(--radius-btn)] font-medium text-white transition-colors"
          style={{ backgroundColor: 'var(--color-accent)' }}
        >
          Sign in with Google
        </button>
      </div>
    )
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'orders', label: 'Orders', icon: <Package className="h-4 w-4" /> },
    { key: 'wishlist', label: 'Wishlist', icon: <Heart className="h-4 w-4" /> },
    { key: 'addresses', label: 'Addresses', icon: <MapPin className="h-4 w-4" /> },
  ]

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-1" style={{ fontFamily: 'var(--font-display)' }}>My Account</h1>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{user.email}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b" style={{ borderColor: 'var(--color-divider)' }}>
        {tabs.map(t => (
          <button
            key={t.key}
            id={t.key}
            onClick={() => setTab(t.key)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors"
            style={{
              borderColor: tab === t.key ? 'var(--color-accent)' : 'transparent',
              color: tab === t.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>Loading…</div>
      ) : (
        <>
          {/* Orders Tab */}
          {tab === 'orders' && (
            <div className="space-y-4">
              {orders.length === 0 ? (
                <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>No orders yet.</p>
              ) : orders.map(order => (
                <div
                  key={order.id}
                  className="rounded-[var(--radius-card)] border p-4"
                  style={{ borderColor: 'var(--color-divider)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-mono" style={{ color: 'var(--color-text-muted)' }}>
                        {order.stripe_session_id.slice(0, 20)}…
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-0.5 rounded-full capitalize font-medium"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-trust)' }}>
                        {order.status}
                      </span>
                      <p className="text-sm font-semibold mt-1">{formatPrice(order.total)}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {order.pawnova_order_lines.map(line => (
                      <div key={line.id} className="flex items-center gap-2 text-xs">
                        {line.image_url && (
                          <Image src={line.image_url} alt={line.title} width={36} height={36}
                            className="rounded object-cover" />
                        )}
                        <span style={{ color: 'var(--color-text)' }}>
                          {line.title}{line.variant_title ? ` — ${line.variant_title}` : ''} ×{line.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                  {/* Reorder button */}
                  <div className="mt-3 flex justify-end">
                    <Link
                      href="/shop"
                      className="text-xs px-3 py-1.5 rounded-[var(--radius-btn)] border font-medium transition-colors hover:bg-[var(--color-bg)]"
                      style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text)' }}
                    >
                      Shop Again
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wishlist Tab */}
          {tab === 'wishlist' && (
            <div>
              {wishlistIds.length === 0 ? (
                <p className="text-center py-12" style={{ color: 'var(--color-text-muted)' }}>
                  No items in your wishlist yet.{' '}
                  <Link href="/shop" style={{ color: 'var(--color-accent)' }}>Browse products →</Link>
                </p>
              ) : (
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
                  {wishlistIds.length} item{wishlistIds.length !== 1 ? 's' : ''} saved
                </p>
              )}
            </div>
          )}

          {/* Addresses Tab */}
          {tab === 'addresses' && (
            <div className="space-y-3">
              {addresses.map(addr => (
                <div
                  key={addr.id}
                  className="rounded-[var(--radius-card)] border p-4 flex items-start justify-between"
                  style={{ borderColor: 'var(--color-divider)', backgroundColor: 'var(--color-surface)' }}
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {addr.label && <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-muted)' }}>{addr.label}</span>}
                      {addr.is_default && (
                        <span className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--color-trust)' }}>
                          <Star className="h-3 w-3" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium">{addr.full_name}</p>
                    <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                      {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                      {addr.city}{addr.state ? `, ${addr.state}` : ''} {addr.postal_code}<br />
                      {addr.country}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="p-1.5 rounded hover:bg-[var(--color-bg)] transition-colors"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}

              {addresses.length < 3 && !showAddressForm && (
                <button
                  onClick={() => setShowAddressForm(true)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-btn)] border text-sm font-medium transition-colors hover:bg-[var(--color-surface)]"
                  style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text)' }}
                >
                  <Plus className="h-4 w-4" /> Add Address ({addresses.length}/3)
                </button>
              )}

              {showAddressForm && (
                <form
                  onSubmit={handleAddAddress}
                  className="rounded-[var(--radius-card)] border p-4 space-y-3"
                  style={{ borderColor: 'var(--color-divider)', backgroundColor: 'var(--color-surface)' }}
                >
                  <h3 className="font-semibold text-sm">New Address</h3>
                  {[
                    { key: 'label', label: 'Label (e.g. Home)', required: false },
                    { key: 'full_name', label: 'Full Name', required: true },
                    { key: 'line1', label: 'Address Line 1', required: true },
                    { key: 'line2', label: 'Address Line 2', required: false },
                    { key: 'city', label: 'City', required: true },
                    { key: 'state', label: 'State / Province', required: false },
                    { key: 'postal_code', label: 'Postal Code', required: true },
                    { key: 'country', label: 'Country', required: true },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-muted)' }}>
                        {field.label}
                      </label>
                      <input
                        type="text"
                        required={field.required}
                        value={addressForm[field.key as keyof typeof addressForm] as string}
                        onChange={e => setAddressForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm rounded-[var(--radius-btn)] border outline-none focus:ring-1"
                        style={{
                          backgroundColor: 'var(--color-bg)',
                          borderColor: 'var(--color-divider)',
                          color: 'var(--color-text)',
                        }}
                      />
                    </div>
                  ))}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={addressForm.is_default}
                      onChange={e => setAddressForm(prev => ({ ...prev, is_default: e.target.checked }))}
                    />
                    Set as default address
                  </label>
                  <div className="flex gap-2">
                    <button type="submit"
                      className="px-4 py-2 rounded-[var(--radius-btn)] text-sm font-medium text-white"
                      style={{ backgroundColor: 'var(--color-accent)' }}>
                      Save
                    </button>
                    <button type="button" onClick={() => setShowAddressForm(false)}
                      className="px-4 py-2 rounded-[var(--radius-btn)] text-sm border"
                      style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-muted)' }}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
