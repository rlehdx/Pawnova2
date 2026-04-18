'use client'

import { useCallback } from 'react'
import { useCartStore } from '@/store/cartStore'
import { useUIStore } from '@/store/uiStore'
import type { Cart } from '@/types/database'

export function useCart() {
  const { cart, isLoading, error, setCart, setLoading, setError } = useCartStore()
  const openCart = useUIStore((s) => s.openCart)

  const addToCart = useCallback(
    async (variantId: string, quantity = 1) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantId, quantity }),
        })

        const data = (await res.json()) as { cart: Cart; error?: string }

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to add to cart')
        }

        setCart(data.cart)
        openCart()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [setCart, setLoading, setError, openCart]
  )

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/cart/update', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineId, quantity }),
        })

        const data = (await res.json()) as { cart: Cart; error?: string }

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to update cart')
        }

        setCart(data.cart)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [setCart, setLoading, setError]
  )

  const removeItem = useCallback(
    async (lineId: string) => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/cart/remove', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lineId }),
        })

        const data = (await res.json()) as { cart: Cart; error?: string }

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to remove from cart')
        }

        setCart(data.cart)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    },
    [setCart, setLoading, setError]
  )

  const fetchCart = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cart/create')
      if (!res.ok) {
        setCart(null)
        return
      }
      const data = (await res.json()) as { cart: Cart | null }
      setCart(data.cart ?? null)
    } catch {
      setCart(null)
    } finally {
      setLoading(false)
    }
  }, [setCart, setLoading])

  return {
    cart,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeItem,
    fetchCart,
    totalQuantity: cart?.totalQuantity ?? 0,
  }
}
