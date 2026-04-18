import { createServerClient } from './client'
import type { Cart, CartLine, DbCart, DbCartLine, DbProductVariant, DbProduct, DbProductImage } from '@/types/database'

// ─── Normalizer ───────────────────────────────────────────────────────────────

interface RawCartLine extends DbCartLine {
  product_variants: DbProductVariant & {
    products: DbProduct & {
      product_images: DbProductImage[]
    }
  }
}

function normalizeCart(cart: DbCart, lines: RawCartLine[]): Cart {
  const normalizedLines: CartLine[] = lines.map((line) => {
    const variant = line.product_variants
    const product = variant.products
    const image = product.product_images?.[0] ?? null

    const selectedOptions = []
    if (variant.option1_name && variant.option1_value) {
      selectedOptions.push({ name: variant.option1_name, value: variant.option1_value })
    }
    if (variant.option2_name && variant.option2_value) {
      selectedOptions.push({ name: variant.option2_name, value: variant.option2_value })
    }

    return {
      id: line.id,
      quantity: line.quantity,
      variantId: line.variant_id,
      variantTitle: variant.title,
      price: variant.price,
      compareAtPrice: variant.compare_at_price,
      totalAmount: variant.price * line.quantity,
      productId: product.id,
      productHandle: product.handle,
      productTitle: product.title,
      image: image ? { url: image.url, altText: image.alt_text } : null,
      selectedOptions,
    }
  })

  const subtotalAmount = normalizedLines.reduce((sum, l) => sum + l.totalAmount, 0)
  const totalQuantity = normalizedLines.reduce((sum, l) => sum + l.quantity, 0)

  return {
    id: cart.id,
    lines: normalizedLines,
    totalQuantity,
    totalAmount: subtotalAmount,
    subtotalAmount,
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchCartWithLines(cartId: string): Promise<Cart | null> {
  const supabase = createServerClient()

  const { data: cart, error: cartError } = await supabase
    .from('pawnova_carts')
    .select('*')
    .eq('id', cartId)
    .single()

  if (cartError || !cart) return null

  const { data: lines, error: linesError } = await supabase
    .from('pawnova_cart_lines')
    .select(`
      *,
      pawnova_product_variants (
        *,
        pawnova_products (
          id, handle, title,
          pawnova_product_images ( id, url, alt_text, sort_order )
        )
      )
    `)
    .eq('cart_id', cartId)
    .order('created_at', { ascending: true })

  if (linesError) throw new Error(`Failed to fetch cart lines: ${linesError.message}`)

  return normalizeCart(cart as DbCart, (lines ?? []) as RawCartLine[])
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function createCart(sessionId: string): Promise<Cart> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('pawnova_carts')
    .insert({ session_id: sessionId })
    .select('*')
    .single()

  if (error) throw new Error(`Failed to create cart: ${error.message}`)

  return normalizeCart(data as DbCart, [])
}

export async function getCartBySessionId(sessionId: string): Promise<Cart | null> {
  const supabase = createServerClient()

  const { data: cart } = await supabase
    .from('pawnova_carts')
    .select('id')
    .eq('session_id', sessionId)
    .single()

  if (!cart) return null
  return fetchCartWithLines(cart.id)
}

export async function addCartLine(
  sessionId: string,
  variantId: string,
  quantity: number
): Promise<Cart> {
  const supabase = createServerClient()

  // Get or create cart
  let { data: cart } = await supabase
    .from('pawnova_carts')
    .select('id')
    .eq('session_id', sessionId)
    .single()

  if (!cart) {
    const { data: newCart, error } = await supabase
      .from('pawnova_carts')
      .insert({ session_id: sessionId })
      .select('id')
      .single()
    if (error || !newCart) throw new Error('Failed to create cart')
    cart = newCart
  }

  // Upsert line (increment if exists)
  const { data: existingLine } = await supabase
    .from('pawnova_cart_lines')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('variant_id', variantId)
    .single()

  if (existingLine) {
    const { error } = await supabase
      .from('pawnova_cart_lines')
      .update({ quantity: existingLine.quantity + quantity })
      .eq('id', existingLine.id)
    if (error) throw new Error(`Failed to update cart line: ${error.message}`)
  } else {
    const { error } = await supabase
      .from('pawnova_cart_lines')
      .insert({ cart_id: cart.id, variant_id: variantId, quantity })
    if (error) throw new Error(`Failed to add cart line: ${error.message}`)
  }

  const result = await fetchCartWithLines(cart.id)
  if (!result) throw new Error('Failed to fetch updated cart')
  return result
}

export async function updateCartLine(
  sessionId: string,
  lineId: string,
  quantity: number
): Promise<Cart> {
  const supabase = createServerClient()

  const { data: cart } = await supabase
    .from('pawnova_carts')
    .select('id')
    .eq('session_id', sessionId)
    .single()

  if (!cart) throw new Error('Cart not found')

  const { error } = await supabase
    .from('pawnova_cart_lines')
    .update({ quantity })
    .eq('id', lineId)
    .eq('cart_id', cart.id)

  if (error) throw new Error(`Failed to update cart line: ${error.message}`)

  const result = await fetchCartWithLines(cart.id)
  if (!result) throw new Error('Failed to fetch updated cart')
  return result
}

export async function removeCartLine(
  sessionId: string,
  lineId: string
): Promise<Cart> {
  const supabase = createServerClient()

  const { data: cart } = await supabase
    .from('pawnova_carts')
    .select('id')
    .eq('session_id', sessionId)
    .single()

  if (!cart) throw new Error('Cart not found')

  const { error } = await supabase
    .from('pawnova_cart_lines')
    .delete()
    .eq('id', lineId)
    .eq('cart_id', cart.id)

  if (error) throw new Error(`Failed to remove cart line: ${error.message}`)

  const result = await fetchCartWithLines(cart.id)
  if (!result) throw new Error('Failed to fetch updated cart')
  return result
}
