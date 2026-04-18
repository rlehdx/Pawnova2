'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Lock, RotateCcw, Truck } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'
import { useCart } from '@/hooks/useCart'
import { CartItem } from './CartItem'
import { Button } from '@/components/ui/Button'
import { formatPrice } from '@/lib/utils'

export function CartDrawer() {
  const { isCartOpen, closeCart } = useUIStore()
  const { cart, isLoading, fetchCart } = useCart()

  useEffect(() => {
    if (isCartOpen) {
      fetchCart()
    }
  }, [isCartOpen, fetchCart])

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isCartOpen])

  // 결제 페이지로 이동 (추후 Stripe 연동)
  const handleCheckout = () => {
    window.location.href = '/checkout'
  }

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={closeCart}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col shadow-2xl"
            style={{ backgroundColor: 'var(--color-bg)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-divider)] px-5 py-4">
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                Your Cart
                {cart && cart.totalQuantity > 0 && (
                  <span className="ml-2 text-sm font-normal" style={{ color: 'var(--color-text-muted)' }}>
                    ({cart.totalQuantity} {cart.totalQuantity === 1 ? 'item' : 'items'})
                  </span>
                )}
              </h2>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="p-2 rounded-[var(--radius-btn)] hover:bg-[var(--color-surface)] transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5">
              {isLoading && !cart ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-accent)] border-t-transparent" />
                </div>
              ) : !cart || cart.lines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <p className="text-base font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                    Your cart is empty
                  </p>
                  <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                    Add something your pet will love!
                  </p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="inline-flex h-10 items-center justify-center rounded-[var(--radius-btn)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
                    style={{ backgroundColor: 'var(--color-accent)' }}
                  >
                    Shop Now
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[var(--color-divider)]">
                  {cart.lines.map((line) => (
                    <CartItem key={line.id} line={line} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cart && cart.lines.length > 0 && (
              <div className="border-t border-[var(--color-divider)] px-5 py-5 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Subtotal</span>
                  <span className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                    {formatPrice(cart.totalAmount)}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Taxes and shipping calculated at checkout.
                </p>

                <Button
                  onClick={handleCheckout}
                  size="lg"
                  className="w-full"
                  isLoading={isLoading}
                >
                  Checkout Securely →
                </Button>

                <div className="flex items-center justify-center gap-4 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL Encrypted</span>
                  <span className="flex items-center gap-1"><RotateCcw className="h-3 w-3" /> Free Returns</span>
                  <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Ships in 1–2 Days</span>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
