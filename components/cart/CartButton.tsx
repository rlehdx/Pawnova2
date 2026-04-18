'use client'

import { ShoppingBag } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/store/uiStore'
import { useCartStore } from '@/store/cartStore'

export function CartButton() {
  const openCart = useUIStore((s) => s.openCart)
  const cart = useCartStore((s) => s.cart)
  const count = cart?.totalQuantity ?? 0

  return (
    <button
      onClick={openCart}
      aria-label={`Open cart${count > 0 ? `, ${count} items` : ''}`}
      className="relative p-2 rounded-[var(--radius-btn)] hover:bg-[var(--color-surface)] transition-colors"
    >
      <ShoppingBag className="h-5 w-5 text-[var(--color-text)]" />
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: 'var(--color-accent)' }}
          >
            {count > 9 ? '9+' : count}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  )
}
