'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { useCart } from '@/hooks/useCart'
import { CartItem } from '@/components/cart/CartItem'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'
import { Lock, RotateCcw, Truck, UserCircle, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

export default function CartPage() {
  const { cart, isLoading, fetchCart } = useCart()
  const [user, setUser] = useState<User | null | undefined>(undefined)
  const [bannerDismissed, setBannerDismissed] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback?next=/cart` },
    })
  }

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  const handleCheckout = async () => {
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const json = await res.json() as { url?: string; error?: string }
      if (!res.ok || !json.url) throw new Error(json.error ?? 'Checkout failed')
      window.location.href = json.url
    } catch (err) {
      console.error('Checkout error:', err)
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 md:px-8 py-12">
      <h1 className="text-3xl font-bold mb-8" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
        Your Cart
      </h1>

      {isLoading && !cart ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
        </div>
      ) : !cart || cart.lines.length === 0 ? (
        <div className="py-20 text-center space-y-4">
          <p className="text-base" style={{ color: 'var(--color-text-muted)' }}>Your cart is empty.</p>
          <Link
            href="/shop"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-btn)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Login encouragement banner */}
          {user === null && !bannerDismissed && (
            <div
              className="flex items-center justify-between gap-3 px-4 py-3 rounded-[var(--radius-card)] border"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
            >
              <div className="flex items-center gap-3">
                <UserCircle className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                    Save your order history
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Sign in to track orders, save addresses &amp; build a wishlist.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSignIn}
                  className="text-xs px-5 py-2.5 min-h-[44px] rounded-[var(--radius-btn)] font-medium text-white whitespace-nowrap"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  Sign in
                </button>
                <button
                  onClick={() => setBannerDismissed(true)}
                  className="p-2 rounded hover:bg-[var(--color-bg)] transition-colors"
                  style={{ color: 'var(--color-text-muted)' }}
                  aria-label="Dismiss"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          <div className="divide-y divide-[var(--color-divider)] border-y border-[var(--color-divider)]">
            {cart.lines.map((line) => (
              <CartItem key={line.id} line={line} />
            ))}
          </div>

          <div className="space-y-3 pt-4">
            <div className="flex justify-between text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <span>Subtotal</span>
              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                {formatPrice(cart.subtotalAmount)}
              </span>
            </div>
            <div className="flex justify-between text-sm" style={{ color: 'var(--color-text-muted)' }}>
              <span>Shipping</span>
              <span>Calculated at checkout</span>
            </div>
            <div className="flex justify-between text-base font-semibold border-t border-[var(--color-divider)] pt-3" style={{ color: 'var(--color-text)' }}>
              <span>Total</span>
              <span>{formatPrice(cart.totalAmount)}</span>
            </div>
          </div>

          <Button onClick={handleCheckout} size="lg" className="w-full" isLoading={isLoading}>
            Checkout Securely →
          </Button>

          <div className="flex items-center justify-center gap-6 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL Encrypted</span>
            <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Free Returns</span>
            <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Ships in 1–2 Days</span>
          </div>

          <p className="text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
            or{' '}
            <Link href="/shop" className="underline hover:text-[var(--color-accent)] transition-colors">
              Continue Shopping
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
