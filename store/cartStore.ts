'use client'

import { create } from 'zustand'
import type { Cart } from '@/types/database'

interface CartStore {
  cart: Cart | null
  isLoading: boolean
  error: string | null
  setCart: (cart: Cart | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>((set) => ({
  cart: null,
  isLoading: false,
  error: null,
  setCart: (cart) => set({ cart }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  clearCart: () => set({ cart: null }),
}))
