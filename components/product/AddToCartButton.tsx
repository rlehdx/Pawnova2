'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/hooks/useCart'
import { cn } from '@/lib/utils'

interface AddToCartButtonProps {
  variantId: string
  availableForSale: boolean
  quantity?: number
  className?: string
}

export function AddToCartButton({
  variantId,
  availableForSale,
  quantity = 1,
  className,
}: AddToCartButtonProps) {
  const { addToCart, isLoading } = useCart()
  const [added, setAdded] = useState(false)

  const handleAdd = async () => {
    if (!variantId || isLoading || added) return
    await addToCart(variantId, quantity)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (!availableForSale) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className={cn(
            'w-full h-12 rounded-[var(--radius-btn)] text-sm font-medium opacity-50 cursor-not-allowed border border-[var(--color-divider)]',
            className
          )}
          style={{ color: 'var(--color-text-muted)' }}
        >
          Out of Stock
        </button>
        <NotifyMeInput />
      </div>
    )
  }

  return (
    <motion.button
      onClick={handleAdd}
      disabled={isLoading || added}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative w-full h-12 rounded-[var(--radius-btn)] text-sm font-semibold text-white transition-colors overflow-hidden',
        isLoading || added ? 'opacity-90' : 'hover:bg-[var(--color-accent-hover)]',
        className
      )}
      style={{ backgroundColor: 'var(--color-accent)' }}
      aria-label={added ? 'Added to cart' : 'Add to cart'}
    >
      <AnimatePresence mode="wait">
        {added ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center justify-center gap-2"
          >
            <Check className="h-4 w-4" />
            Added!
          </motion.span>
        ) : isLoading ? (
          <motion.span
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center"
          >
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </motion.span>
        ) : (
          <motion.span
            key="default"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            Add to Cart
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  )
}

function NotifyMeInput() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email) setSubmitted(true)
  }

  if (submitted) {
    return (
      <p className="text-sm text-center" style={{ color: 'var(--color-trust)' }}>
        We&apos;ll notify you when it&apos;s back in stock!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Notify me when available"
        className="flex-1 h-10 rounded-[var(--radius-btn)] border border-[var(--color-divider)] bg-[var(--color-surface)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
        style={{ color: 'var(--color-text)' }}
        required
      />
      <button
        type="submit"
        className="h-10 rounded-[var(--radius-btn)] px-4 text-sm font-medium border border-[var(--color-divider)] hover:bg-[var(--color-surface)] transition-colors"
        style={{ color: 'var(--color-text)' }}
      >
        Notify
      </button>
    </form>
  )
}
