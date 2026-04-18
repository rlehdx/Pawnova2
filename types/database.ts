// ─── Supabase DB Row Types ────────────────────────────────────────────────────

export interface DbCollection {
  id: string
  handle: string
  title: string
  description: string | null
  image_url: string | null
  image_alt: string | null
  seo_title: string | null
  seo_description: string | null
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface DbProduct {
  id: string
  handle: string
  title: string
  description: string | null
  description_html: string | null
  tags: string[]
  is_active: boolean
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export interface DbProductImage {
  id: string
  product_id: string
  url: string
  alt_text: string | null
  width: number | null
  height: number | null
  sort_order: number
  created_at: string
}

export interface DbProductVariant {
  id: string
  product_id: string
  title: string
  price: number
  compare_at_price: number | null
  sku: string | null
  inventory_quantity: number
  available_for_sale: boolean
  option1_name: string | null
  option1_value: string | null
  option2_name: string | null
  option2_value: string | null
  image_url: string | null
  image_alt: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DbProductCollection {
  product_id: string
  collection_id: string
  sort_order: number
}

export interface DbCart {
  id: string
  session_id: string
  created_at: string
  updated_at: string
}

export interface DbCartLine {
  id: string
  cart_id: string
  variant_id: string
  quantity: number
  created_at: string
  updated_at: string
}

export interface DbNewsletterSubscriber {
  id: string
  email: string
  created_at: string
}

// ─── Normalized UI Types ──────────────────────────────────────────────────────

export interface ProductImage {
  id: string
  url: string
  altText: string | null
  width: number | null
  height: number | null
}

export interface SelectedOption {
  name: string
  value: string
}

export interface ProductVariant {
  id: string
  title: string
  price: number
  compareAtPrice: number | null
  sku: string | null
  inventoryQuantity: number
  availableForSale: boolean
  selectedOptions: SelectedOption[]
  image: { url: string; altText: string | null } | null
}

export interface Collection {
  id: string
  handle: string
  title: string
  description: string | null
  image: { url: string; altText: string | null } | null
  seo: { title: string | null; description: string | null }
}

export interface Product {
  id: string
  handle: string
  title: string
  description: string
  descriptionHtml: string
  price: number               // lowest variant price
  compareAtPrice: number | null
  images: ProductImage[]
  variants: ProductVariant[]
  tags: string[]
  collections: Collection[]
  seo: { title: string | null; description: string | null }
  featuredImage: ProductImage | null
  isOnSale: boolean
  availableForSale: boolean
}

export interface CartLine {
  id: string
  quantity: number
  variantId: string
  variantTitle: string
  price: number
  compareAtPrice: number | null
  totalAmount: number
  productId: string
  productHandle: string
  productTitle: string
  image: { url: string; altText: string | null } | null
  selectedOptions: SelectedOption[]
}

export interface Cart {
  id: string
  lines: CartLine[]
  totalQuantity: number
  totalAmount: number
  subtotalAmount: number
}

// ─── Utility ──────────────────────────────────────────────────────────────────

export interface PageInfo {
  hasNextPage: boolean
  hasPreviousPage: boolean
  endCursor: string | null
  startCursor: string | null
}

export type SortKey = 'created_at' | 'price' | 'title' | 'best_selling'
export type SortOrder = 'asc' | 'desc'

export interface GetProductsOptions {
  first?: number
  after?: string
  sortKey?: SortKey
  sortOrder?: SortOrder
  collectionHandle?: string
  query?: string
  minPrice?: number
  maxPrice?: number
}

export interface ProductsResult {
  products: Product[]
  total: number
  hasNextPage: boolean
}

export interface DbOrder {
  id: string
  stripe_session_id: string
  stripe_payment_intent: string | null
  customer_email: string
  customer_name: string | null
  status: 'paid' | 'processing' | 'shipped' | 'delivered' | 'refunded' | 'cancelled'
  subtotal: number
  total: number
  shipping_address: Record<string, string> | null
  created_at: string
  updated_at: string
}

export interface DbOrderLine {
  id: string
  order_id: string
  product_id: string | null
  variant_id: string | null
  title: string
  variant_title: string | null
  quantity: number
  price: number
  image_url: string | null
  created_at: string
}
