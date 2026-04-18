'use client'

import useSWR from 'swr'
import type { Product } from '@/types/database'

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch product')
  return res.json() as Promise<Product>
}

export function useProduct(handle: string) {
  const { data, error, isLoading } = useSWR<Product>(
    handle ? `/api/products/${handle}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  return {
    product: data ?? null,
    isLoading,
    error: error as Error | null,
  }
}
