# PawNova Admin + Stripe 결제 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase Auth 기반 어드민 페이지 (상품/컬렉션/주문/통계 풀 관리) + Stripe 결제 완성

**Architecture:** Supabase Auth로 admin 계정 인증, middleware.ts로 `/admin/*` 경로 보호. Admin API routes는 Service Role Key 사용. Stripe Checkout Session으로 결제 처리, webhook으로 orders 테이블에 저장.

**Tech Stack:** Next.js 15, Supabase Auth + @supabase/ssr, Stripe, Tailwind CSS, lucide-react

---

## 파일 구조

### 새로 생성
- `middleware.ts` — /admin/* 경로 Supabase Auth 세션 확인
- `supabase/schema_v2.sql` — orders, order_lines 테이블 + admin RLS 정책
- `lib/supabase/admin-client.ts` — Supabase Auth용 서버 클라이언트 (@supabase/ssr)
- `lib/stripe.ts` — Stripe 인스턴스 + 유틸
- `app/admin/login/page.tsx` — 로그인 페이지
- `app/admin/layout.tsx` — 어드민 레이아웃 (사이드바)
- `app/admin/page.tsx` — 대시보드 (통계 카드 + 그래프 + 주문 목록)
- `app/admin/products/page.tsx` — 상품 목록
- `app/admin/products/new/page.tsx` — 상품 추가
- `app/admin/products/[id]/page.tsx` — 상품 수정
- `app/admin/collections/page.tsx` — 컬렉션 관리
- `app/admin/orders/page.tsx` — 주문 관리 (상태변경 + 환불)
- `app/admin/subscribers/page.tsx` — 뉴스레터 구독자
- `app/api/admin/products/route.ts` — GET 목록 / POST 생성
- `app/api/admin/products/[id]/route.ts` — GET 단건 / PUT 수정 / DELETE 삭제
- `app/api/admin/collections/route.ts` — GET / POST / PUT / DELETE
- `app/api/admin/orders/route.ts` — GET 주문 목록
- `app/api/admin/orders/[id]/route.ts` — PUT 상태변경 / POST 환불
- `app/api/admin/stats/route.ts` — 대시보드 통계
- `app/api/admin/upload/route.ts` — Supabase Storage 이미지 업로드
- `app/api/checkout/route.ts` — Stripe Checkout Session 생성
- `app/api/stripe/webhook/route.ts` — 결제완료 → orders 저장
- `app/checkout/success/page.tsx` — 결제 성공 페이지
- `app/checkout/cancel/page.tsx` — 결제 취소 페이지
- `types/admin.ts` — 어드민 관련 타입

### 수정
- `types/database.ts` — DbOrder, DbOrderLine 타입 추가
- `app/cart/page.tsx` — /checkout → /api/checkout POST로 변경
- `next.config.ts` — 추가 image domains 없음 (이미 supabase.co 허용됨)
- `.env.example` — STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 추가

---

## Task 1: DB 스키마 확장 + 환경변수

**Files:**
- Create: `supabase/schema_v2.sql`
- Modify: `.env.example`

- [ ] **Step 1: schema_v2.sql 작성**

```sql
-- ============================================================
-- PawNova Schema V2 — orders + admin RLS
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ─── Orders ──────────────────────────────────────────────────
create table if not exists orders (
  id                uuid primary key default uuid_generate_v4(),
  stripe_session_id text unique not null,
  stripe_payment_intent text,
  customer_email    text not null,
  customer_name     text,
  status            text not null default 'paid'
                    check (status in ('paid','processing','shipped','delivered','refunded','cancelled')),
  subtotal          numeric(10,2) not null,
  total             numeric(10,2) not null,
  shipping_address  jsonb,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ─── Order Lines ─────────────────────────────────────────────
create table if not exists order_lines (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid references orders(id) on delete cascade,
  product_id  uuid references products(id) on delete set null,
  variant_id  uuid references product_variants(id) on delete set null,
  title       text not null,
  variant_title text,
  quantity    integer not null,
  price       numeric(10,2) not null,
  image_url   text,
  created_at  timestamptz default now()
);

-- ─── Triggers ────────────────────────────────────────────────
create trigger orders_updated_at
  before update on orders
  for each row execute function update_updated_at();

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_customer_email on orders(customer_email);
create index if not exists idx_order_lines_order_id on order_lines(order_id);

-- ─── RLS ─────────────────────────────────────────────────────
alter table orders enable row level security;
alter table order_lines enable row level security;

-- Service role bypasses RLS automatically — no policy needed for admin
-- Public: no access (orders are private)
-- (service_role key used in admin API routes bypasses RLS)

-- ─── Admin: full access to all tables via service role ───────
-- Products/collections: allow insert/update/delete for service role
-- (Service role bypasses RLS by default in Supabase)

-- Allow public read of ALL products (including inactive) — admin needs this
-- Admin API uses service_role which bypasses RLS, so no extra policy needed.
```

파일 저장: `supabase/schema_v2.sql`

- [ ] **Step 2: .env.example 업데이트**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_SITE_URL=https://pawnova.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

- [ ] **Step 3: Supabase에서 schema_v2.sql 실행**

Supabase Dashboard → SQL Editor → schema_v2.sql 내용 붙여넣기 → Run

- [ ] **Step 4: Stripe Storage bucket 생성**

Supabase Dashboard → Storage → New Bucket → 이름: `product-images` → Public: true

- [ ] **Step 5: Commit**

```bash
git add supabase/schema_v2.sql .env.example
git commit -m "feat: add orders schema and stripe env vars"
```

---

## Task 2: 타입 확장 + Supabase Auth 클라이언트

**Files:**
- Modify: `types/database.ts`
- Create: `lib/supabase/admin-client.ts`

- [ ] **Step 1: types/database.ts에 Order 타입 추가**

파일 끝에 추가:

```typescript
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
```

- [ ] **Step 2: types/admin.ts 생성**

```typescript
export interface AdminStats {
  totalRevenue: number
  totalOrders: number
  totalProducts: number
  totalSubscribers: number
  revenueByDay: { date: string; revenue: number }[]
  topProducts: { title: string; total: number }[]
  recentOrders: {
    id: string
    customer_email: string
    total: number
    status: string
    created_at: string
  }[]
}
```

- [ ] **Step 3: lib/supabase/admin-client.ts 생성**

`@supabase/ssr` 패키지 설치 확인 (package.json에 이미 있음):

```typescript
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

function getEnv(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Missing env: ${key}`)
  return value
}

// Auth-aware server client — reads session from cookies
export async function createAuthClient() {
  const cookieStore = await cookies()
  return createSupabaseServerClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // middleware에서 setAll 호출 시 무시 가능
          }
        },
      },
    }
  )
}

// Service role client — RLS 우회, admin API에서만 사용
export function createAdminClient() {
  return createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add types/database.ts types/admin.ts lib/supabase/admin-client.ts
git commit -m "feat: add order types and admin supabase client"
```

---

## Task 3: Middleware + Admin 로그인

**Files:**
- Create: `middleware.ts`
- Create: `app/admin/login/page.tsx`
- Create: `app/api/admin/auth/route.ts`

- [ ] **Step 1: middleware.ts 생성**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // /admin/login은 보호 제외
  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {
    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
  }

  // 이미 로그인한 상태에서 /admin/login 접근 시 대시보드로
  if (request.nextUrl.pathname === '/admin/login' && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
```

- [ ] **Step 2: app/admin/login/page.tsx 생성**

```typescript
'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/admin')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-6 text-gray-900">PawNova Admin</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Supabase Auth에서 admin 계정 생성**

Supabase Dashboard → Authentication → Users → Add User
- Email: admin@pawnova.com (원하는 이메일)
- Password: 강력한 비밀번호 설정

- [ ] **Step 4: Commit**

```bash
git add middleware.ts app/admin/login/page.tsx
git commit -m "feat: admin auth middleware and login page"
```

---

## Task 4: 어드민 레이아웃 + 사이드바

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/AdminSidebar.tsx`

- [ ] **Step 1: app/admin/AdminSidebar.tsx 생성**

```typescript
'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { LayoutDashboard, Package, FolderOpen, ShoppingCart, Mail, LogOut } from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/collections', label: 'Collections', icon: FolderOpen },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/admin/subscribers', label: 'Subscribers', icon: Mail },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="px-6 py-5 border-b border-gray-700">
        <span className="font-bold text-lg">🐾 PawNova</span>
        <p className="text-xs text-gray-400 mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-3">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 pb-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 w-full transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: app/admin/layout.tsx 생성**

```typescript
import { AdminSidebar } from './AdminSidebar'

export const metadata = { title: 'PawNova Admin' }

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/layout.tsx app/admin/AdminSidebar.tsx
git commit -m "feat: admin layout with sidebar navigation"
```

---

## Task 5: Admin API — 상품 CRUD

**Files:**
- Create: `app/api/admin/products/route.ts`
- Create: `app/api/admin/products/[id]/route.ts`
- Create: `app/api/admin/upload/route.ts`

- [ ] **Step 1: app/api/admin/products/route.ts 생성**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { createAuthClient } from '@/lib/supabase/admin-client'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  return user
}

export async function GET() {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const { data: products, error } = await db
      .from('products')
      .select(`
        id, handle, title, is_active, created_at, updated_at,
        product_variants (id, price, inventory_quantity),
        product_images (id, url, sort_order)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ products })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const body = await request.json() as {
      handle: string
      title: string
      description?: string
      description_html?: string
      tags?: string[]
      seo_title?: string
      seo_description?: string
      is_active?: boolean
      images?: { url: string; alt_text?: string; sort_order?: number }[]
      variants: {
        title: string
        price: number
        compare_at_price?: number
        sku?: string
        inventory_quantity?: number
        option1_name?: string
        option1_value?: string
        option2_name?: string
        option2_value?: string
        image_url?: string
      }[]
      collection_ids?: string[]
    }

    const { images, variants, collection_ids, ...productData } = body

    const { data: product, error: pErr } = await db
      .from('products')
      .insert({ ...productData, is_active: productData.is_active ?? true })
      .select()
      .single()

    if (pErr) throw pErr

    if (images?.length) {
      await db.from('product_images').insert(
        images.map((img, i) => ({ ...img, product_id: product.id, sort_order: i }))
      )
    }

    if (variants?.length) {
      await db.from('product_variants').insert(
        variants.map((v, i) => ({ ...v, product_id: product.id, sort_order: i }))
      )
    }

    if (collection_ids?.length) {
      await db.from('product_collections').insert(
        collection_ids.map(cid => ({ product_id: product.id, collection_id: cid }))
      )
    }

    return NextResponse.json({ product }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    const status = msg === 'Unauthorized' ? 401 : 500
    return NextResponse.json({ error: msg }, { status })
  }
}
```

- [ ] **Step 2: app/api/admin/products/[id]/route.ts 생성**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const { data, error } = await db
      .from('products')
      .select(`
        *,
        product_images (*),
        product_variants (*),
        product_collections (collection_id)
      `)
      .eq('id', id)
      .single()
    if (error) throw error
    return NextResponse.json({ product: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const body = await request.json() as {
      title?: string
      description?: string
      description_html?: string
      tags?: string[]
      is_active?: boolean
      seo_title?: string
      seo_description?: string
      images?: { id?: string; url: string; alt_text?: string; sort_order?: number }[]
      variants?: {
        id?: string
        title: string
        price: number
        compare_at_price?: number | null
        sku?: string
        inventory_quantity?: number
        option1_name?: string | null
        option1_value?: string | null
        option2_name?: string | null
        option2_value?: string | null
        image_url?: string | null
      }[]
      collection_ids?: string[]
    }

    const { images, variants, collection_ids, ...productData } = body

    const { error: pErr } = await db.from('products').update(productData).eq('id', id)
    if (pErr) throw pErr

    if (images !== undefined) {
      await db.from('product_images').delete().eq('product_id', id)
      if (images.length) {
        await db.from('product_images').insert(
          images.map((img, i) => ({
            url: img.url,
            alt_text: img.alt_text,
            sort_order: img.sort_order ?? i,
            product_id: id,
          }))
        )
      }
    }

    if (variants !== undefined) {
      await db.from('product_variants').delete().eq('product_id', id)
      if (variants.length) {
        await db.from('product_variants').insert(
          variants.map((v, i) => ({ ...v, id: undefined, product_id: id, sort_order: i }))
        )
      }
    }

    if (collection_ids !== undefined) {
      await db.from('product_collections').delete().eq('product_id', id)
      if (collection_ids.length) {
        await db.from('product_collections').insert(
          collection_ids.map(cid => ({ product_id: id, collection_id: cid }))
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const { error } = await db.from('products').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
```

- [ ] **Step 3: app/api/admin/upload/route.ts 생성**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

export async function POST(request: NextRequest) {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await db.storage
      .from('product-images')
      .upload(filename, file, { contentType: file.type, upsert: false })

    if (error) throw error

    const { data: { publicUrl } } = db.storage
      .from('product-images')
      .getPublicUrl(filename)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Upload failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/admin/products/ app/api/admin/upload/
git commit -m "feat: admin product CRUD and image upload APIs"
```

---

## Task 6: Admin API — 컬렉션, 주문, 통계

**Files:**
- Create: `app/api/admin/collections/route.ts`
- Create: `app/api/admin/orders/route.ts`
- Create: `app/api/admin/orders/[id]/route.ts`
- Create: `app/api/admin/stats/route.ts`

- [ ] **Step 1: app/api/admin/collections/route.ts 생성**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

export async function GET() {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const { data, error } = await db
      .from('collections')
      .select('*')
      .order('sort_order', { ascending: true })
    if (error) throw error
    return NextResponse.json({ collections: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const body = await request.json()
    const { data, error } = await db.from('collections').insert(body).select().single()
    if (error) throw error
    return NextResponse.json({ collection: data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const body = await request.json() as { id: string } & Record<string, unknown>
    const { id, ...updates } = body
    const { error } = await db.from('collections').update(updates).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin()
    const db = createAdminClient()
    const { id } = await request.json() as { id: string }
    const { error } = await db.from('collections').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
```

- [ ] **Step 2: app/api/admin/orders/route.ts 생성**

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

export async function GET() {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()
    const { data, error } = await db
      .from('orders')
      .select('*, order_lines(*)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return NextResponse.json({ orders: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Step 3: app/api/admin/orders/[id]/route.ts 생성**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'
import Stripe from 'stripe'

async function requireAdmin() {
  const supabase = await createAuthClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
}

type Params = { params: Promise<{ id: string }> }

// PUT: 주문 상태 변경
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()
    const { status } = await request.json() as { status: string }
    const { error } = await db.from('orders').update({ status }).eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}

// POST: Stripe 환불
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await requireAdmin()
    const { id } = await params
    const db = createAdminClient()

    const { data: order, error } = await db
      .from('orders')
      .select('stripe_payment_intent, total')
      .eq('id', id)
      .single()
    if (error || !order) throw new Error('Order not found')
    if (!order.stripe_payment_intent) throw new Error('No payment intent on this order')

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
    await stripe.refunds.create({ payment_intent: order.stripe_payment_intent })

    await db.from('orders').update({ status: 'refunded' }).eq('id', id)

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: msg === 'Unauthorized' ? 401 : 500 })
  }
}
```

- [ ] **Step 4: app/api/admin/stats/route.ts 생성**

```typescript
import { NextResponse } from 'next/server'
import { createAdminClient, createAuthClient } from '@/lib/supabase/admin-client'

export async function GET() {
  try {
    const authClient = await createAuthClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = createAdminClient()

    const [ordersRes, productsRes, subscribersRes] = await Promise.all([
      db.from('orders').select('total, created_at, customer_email, status, id').order('created_at', { ascending: false }),
      db.from('products').select('id', { count: 'exact', head: true }),
      db.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
    ])

    const orders = ordersRes.data ?? []
    const totalRevenue = orders.filter(o => o.status !== 'refunded' && o.status !== 'cancelled')
      .reduce((sum, o) => sum + Number(o.total), 0)
    const totalOrders = orders.length

    // 최근 30일 매출 by day
    const now = new Date()
    const revenueByDay: Record<string, number> = {}
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      revenueByDay[d.toISOString().slice(0, 10)] = 0
    }
    orders.forEach(o => {
      const day = o.created_at.slice(0, 10)
      if (day in revenueByDay && o.status !== 'refunded' && o.status !== 'cancelled') {
        revenueByDay[day] += Number(o.total)
      }
    })

    const recentOrders = orders.slice(0, 10).map(o => ({
      id: o.id,
      customer_email: o.customer_email,
      total: o.total,
      status: o.status,
      created_at: o.created_at,
    }))

    return NextResponse.json({
      totalRevenue,
      totalOrders,
      totalProducts: productsRes.count ?? 0,
      totalSubscribers: subscribersRes.count ?? 0,
      revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
      recentOrders,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/api/admin/
git commit -m "feat: admin collections, orders, stats APIs"
```

---

## Task 7: 어드민 대시보드 페이지

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: app/admin/page.tsx 생성**

```typescript
import { createAdminClient } from '@/lib/supabase/admin-client'
import { formatPrice } from '@/lib/utils'
import { TrendingUp, Package, ShoppingCart, Mail } from 'lucide-react'

async function getStats() {
  const db = createAdminClient()
  const [ordersRes, productsRes, subscribersRes] = await Promise.all([
    db.from('orders').select('total, created_at, customer_email, status, id').order('created_at', { ascending: false }),
    db.from('products').select('id', { count: 'exact', head: true }),
    db.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
  ])
  const orders = ordersRes.data ?? []
  const totalRevenue = orders.filter(o => o.status !== 'refunded' && o.status !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total), 0)

  const now = new Date()
  const revenueByDay: Record<string, number> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    revenueByDay[d.toISOString().slice(0, 10)] = 0
  }
  orders.forEach(o => {
    const day = o.created_at.slice(0, 10)
    if (day in revenueByDay && o.status !== 'refunded' && o.status !== 'cancelled') {
      revenueByDay[day] += Number(o.total)
    }
  })

  return {
    totalRevenue,
    totalOrders: orders.length,
    totalProducts: productsRes.count ?? 0,
    totalSubscribers: subscribersRes.count ?? 0,
    recentOrders: orders.slice(0, 8),
    revenueByDay: Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue })),
  }
}

const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-gray-100 text-gray-700',
  refunded: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default async function AdminDashboard() {
  const stats = await getStats()
  const maxRevenue = Math.max(...stats.revenueByDay.map(d => d.revenue), 1)

  const statCards = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: TrendingUp, color: 'text-green-600' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: ShoppingCart, color: 'text-blue-600' },
    { label: 'Products', value: String(stats.totalProducts), icon: Package, color: 'text-purple-600' },
    { label: 'Subscribers', value: String(stats.totalSubscribers), icon: Mail, color: 'text-orange-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className={`inline-flex p-2 rounded-lg bg-gray-50 mb-3 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Chart (bar) */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Revenue — Last 30 Days</h2>
        <div className="flex items-end gap-0.5 h-32">
          {stats.revenueByDay.map(({ date, revenue }) => (
            <div
              key={date}
              className="flex-1 bg-gray-900 rounded-t"
              style={{ height: `${(revenue / maxRevenue) * 100}%`, minHeight: revenue > 0 ? '4px' : '0' }}
              title={`${date}: ${formatPrice(revenue)}`}
            />
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {stats.recentOrders.length === 0 && (
            <p className="px-6 py-8 text-sm text-gray-400 text-center">No orders yet</p>
          )}
          {stats.recentOrders.map(order => (
            <div key={order.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{order.customer_email}</p>
                <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </span>
                <span className="text-sm font-semibold text-gray-900">{formatPrice(Number(order.total))}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: admin dashboard with stats and revenue chart"
```

---

## Task 8: 어드민 상품 관리 페이지

**Files:**
- Create: `app/admin/products/page.tsx`
- Create: `app/admin/products/new/page.tsx`
- Create: `app/admin/products/[id]/page.tsx`
- Create: `app/admin/products/ProductForm.tsx`

- [ ] **Step 1: app/admin/products/page.tsx 생성**

```typescript
import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin-client'
import { formatPrice } from '@/lib/utils'
import { Plus } from 'lucide-react'

async function getProducts() {
  const db = createAdminClient()
  const { data } = await db
    .from('products')
    .select('id, handle, title, is_active, created_at, product_variants(price), product_images(url, sort_order)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export default async function AdminProductsPage() {
  const products = await getProducts()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Product</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Price</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {products.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No products yet</td></tr>
            )}
            {products.map(product => {
              const variants = product.product_variants as { price: number }[]
              const images = product.product_images as { url: string; sort_order: number }[]
              const sortedImages = [...images].sort((a, b) => a.sort_order - b.sort_order)
              const minPrice = variants.length ? Math.min(...variants.map(v => v.price)) : 0
              return (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {sortedImages[0] && (
                        <img src={sortedImages[0].url} alt={product.title} className="h-10 w-10 object-cover rounded-lg" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{product.title}</p>
                        <p className="text-xs text-gray-400">{product.handle}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{formatPrice(minPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${product.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {product.is_active ? 'Active' : 'Draft'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${product.id}`} className="text-blue-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: app/admin/products/ProductForm.tsx 생성**

이 파일은 새 상품 추가/수정 공용 폼 컴포넌트입니다.

```typescript
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Upload } from 'lucide-react'

interface VariantInput {
  id?: string
  title: string
  price: string
  compare_at_price: string
  sku: string
  inventory_quantity: string
  option1_name: string
  option1_value: string
}

interface ImageInput {
  url: string
  alt_text: string
  isUploading?: boolean
}

interface Collection {
  id: string
  title: string
}

interface ProductFormProps {
  mode: 'new' | 'edit'
  productId?: string
  collections: Collection[]
  initialData?: {
    title: string
    handle: string
    description: string
    description_html: string
    tags: string
    is_active: boolean
    seo_title: string
    seo_description: string
    images: ImageInput[]
    variants: VariantInput[]
    collection_ids: string[]
  }
}

const defaultVariant: VariantInput = {
  title: 'Default',
  price: '',
  compare_at_price: '',
  sku: '',
  inventory_quantity: '0',
  option1_name: '',
  option1_value: '',
}

export function ProductForm({ mode, productId, collections, initialData }: ProductFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialData?.title ?? '')
  const [handle, setHandle] = useState(initialData?.handle ?? '')
  const [description, setDescription] = useState(initialData?.description ?? '')
  const [tags, setTags] = useState(initialData?.tags ?? '')
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true)
  const [seoTitle, setSeoTitle] = useState(initialData?.seo_title ?? '')
  const [seoDescription, setSeoDescription] = useState(initialData?.seo_description ?? '')
  const [images, setImages] = useState<ImageInput[]>(initialData?.images ?? [])
  const [variants, setVariants] = useState<VariantInput[]>(initialData?.variants ?? [{ ...defaultVariant }])
  const [selectedCollections, setSelectedCollections] = useState<string[]>(initialData?.collection_ids ?? [])

  async function uploadFile(file: File): Promise<string> {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json() as { url?: string; error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Upload failed')
    return json.url!
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    const placeholders: ImageInput[] = Array.from(files).map(() => ({ url: '', alt_text: '', isUploading: true }))
    setImages(prev => [...prev, ...placeholders])
    const startIdx = images.length
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadFile(files[i])
        setImages(prev => {
          const next = [...prev]
          next[startIdx + i] = { url, alt_text: files[i].name, isUploading: false }
          return next
        })
      } catch {
        setImages(prev => prev.filter((_, idx) => idx !== startIdx + i))
      }
    }
  }

  async function handleSave() {
    if (!title || !handle || variants.some(v => !v.price)) {
      setError('Title, handle, and variant prices are required')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = {
        title,
        handle,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        is_active: isActive,
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        images: images.filter(img => img.url).map((img, i) => ({ url: img.url, alt_text: img.alt_text || null, sort_order: i })),
        variants: variants.map((v, i) => ({
          title: v.title || 'Default',
          price: parseFloat(v.price),
          compare_at_price: v.compare_at_price ? parseFloat(v.compare_at_price) : null,
          sku: v.sku || null,
          inventory_quantity: parseInt(v.inventory_quantity) || 0,
          option1_name: v.option1_name || null,
          option1_value: v.option1_value || null,
          sort_order: i,
        })),
        collection_ids: selectedCollections,
      }

      const url = mode === 'new' ? '/api/admin/products' : `/api/admin/products/${productId}`
      const method = mode === 'new' ? 'POST' : 'PUT'
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json() as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!productId || !confirm('Delete this product? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      router.push('/admin/products')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
      setDeleting(false)
    }
  }

  function toggleCollection(id: string) {
    setSelectedCollections(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  return (
    <div className="max-w-3xl space-y-6">
      {error && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}

      {/* Basic Info */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Basic Info</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Handle (URL slug) *</label>
            <input value={handle} onChange={e => setHandle(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
          <input value={tags} onChange={e => setTags(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="rounded" />
          <span className="text-gray-700">Active (visible in store)</span>
        </label>
      </div>

      {/* Images */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Images</h2>
        <div className="flex flex-wrap gap-3">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              {img.isUploading ? (
                <div className="h-20 w-20 rounded-lg bg-gray-100 flex items-center justify-center">
                  <div className="animate-spin h-5 w-5 border-2 border-gray-400 border-t-transparent rounded-full" />
                </div>
              ) : (
                <img src={img.url} alt={img.alt_text} className="h-20 w-20 object-cover rounded-lg" />
              )}
              <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => fileInputRef.current?.click()}
              className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 text-xs">
              <Upload className="h-4 w-4" />
              Upload
            </button>
            <button onClick={() => setImages(prev => [...prev, { url: '', alt_text: '' }])}
              className="h-20 w-20 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-gray-400 text-xs">
              <Plus className="h-4 w-4" />
              URL
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
        </div>
        {images.filter(img => !img.isUploading && !img.url.startsWith('http')).map((img, i) => (
          <input key={i} value={img.url} onChange={e => setImages(prev => { const n = [...prev]; n[i] = { ...n[i], url: e.target.value }; return n })}
            placeholder="https://..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        ))}
      </div>

      {/* Variants */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Variants</h2>
          <button onClick={() => setVariants(prev => [...prev, { ...defaultVariant }])}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
            <Plus className="h-4 w-4" /> Add Variant
          </button>
        </div>
        {variants.map((v, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Variant {i + 1}</span>
              {variants.length > 1 && (
                <button onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}>
                  <Trash2 className="h-4 w-4 text-red-400" />
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title</label>
                <input value={v.title} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], title: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Price *</label>
                <input type="number" step="0.01" value={v.price} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], price: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Compare At Price</label>
                <input type="number" step="0.01" value={v.compare_at_price} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], compare_at_price: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">SKU</label>
                <input value={v.sku} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], sku: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Inventory</label>
                <input type="number" value={v.inventory_quantity} onChange={e => setVariants(prev => { const n = [...prev]; n[i] = { ...n[i], inventory_quantity: e.target.value }; return n })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Collections */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">Collections</h2>
        <div className="flex flex-wrap gap-2">
          {collections.map(col => (
            <label key={col.id} className="flex items-center gap-2 text-sm cursor-pointer bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100">
              <input type="checkbox" checked={selectedCollections.includes(col.id)} onChange={() => toggleCollection(col.id)} className="rounded" />
              {col.title}
            </label>
          ))}
        </div>
      </div>

      {/* SEO */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-3">
        <h2 className="font-semibold text-gray-900">SEO</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Title</label>
          <input value={seoTitle} onChange={e => setSeoTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SEO Description</label>
          <textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} rows={2}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving}
          className="bg-gray-900 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
          {saving ? 'Saving...' : mode === 'new' ? 'Create Product' : 'Save Changes'}
        </button>
        {mode === 'edit' && (
          <button onClick={handleDelete} disabled={deleting}
            className="bg-red-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50">
            {deleting ? 'Deleting...' : 'Delete Product'}
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: app/admin/products/new/page.tsx 생성**

```typescript
import { createAdminClient } from '@/lib/supabase/admin-client'
import { ProductForm } from '../ProductForm'

async function getCollections() {
  const db = createAdminClient()
  const { data } = await db.from('collections').select('id, title').order('sort_order')
  return data ?? []
}

export default async function NewProductPage() {
  const collections = await getCollections()
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h1>
      <ProductForm mode="new" collections={collections} />
    </div>
  )
}
```

- [ ] **Step 4: app/admin/products/[id]/page.tsx 생성**

```typescript
import { createAdminClient } from '@/lib/supabase/admin-client'
import { ProductForm } from '../ProductForm'
import { notFound } from 'next/navigation'

async function getProduct(id: string) {
  const db = createAdminClient()
  const { data } = await db
    .from('products')
    .select('*, product_images(*), product_variants(*), product_collections(collection_id)')
    .eq('id', id)
    .single()
  return data
}

async function getCollections() {
  const db = createAdminClient()
  const { data } = await db.from('collections').select('id, title').order('sort_order')
  return data ?? []
}

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [product, collections] = await Promise.all([getProduct(id), getCollections()])
  if (!product) notFound()

  const images = (product.product_images as { url: string; alt_text: string | null; sort_order: number }[])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(img => ({ url: img.url, alt_text: img.alt_text ?? '' }))

  const variants = (product.product_variants as {
    id: string; title: string; price: number; compare_at_price: number | null;
    sku: string | null; inventory_quantity: number; option1_name: string | null; option1_value: string | null;
  }[]).map(v => ({
    id: v.id,
    title: v.title,
    price: String(v.price),
    compare_at_price: v.compare_at_price != null ? String(v.compare_at_price) : '',
    sku: v.sku ?? '',
    inventory_quantity: String(v.inventory_quantity),
    option1_name: v.option1_name ?? '',
    option1_value: v.option1_value ?? '',
  }))

  const collectionIds = (product.product_collections as { collection_id: string }[]).map(pc => pc.collection_id)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Product</h1>
      <ProductForm
        mode="edit"
        productId={id}
        collections={collections}
        initialData={{
          title: product.title,
          handle: product.handle,
          description: product.description ?? '',
          description_html: product.description_html ?? '',
          tags: (product.tags as string[]).join(', '),
          is_active: product.is_active,
          seo_title: product.seo_title ?? '',
          seo_description: product.seo_description ?? '',
          images,
          variants,
          collection_ids: collectionIds,
        }}
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/products/
git commit -m "feat: admin product management pages"
```

---

## Task 9: 어드민 컬렉션, 주문, 구독자 페이지

**Files:**
- Create: `app/admin/collections/page.tsx`
- Create: `app/admin/orders/page.tsx`
- Create: `app/admin/subscribers/page.tsx`

- [ ] **Step 1: app/admin/collections/page.tsx 생성**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react'

interface Collection {
  id: string
  handle: string
  title: string
  description: string | null
  is_active: boolean
  sort_order: number
}

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Collection>>({})
  const [newForm, setNewForm] = useState({ handle: '', title: '', description: '' })
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchCollections() }, [])

  async function fetchCollections() {
    const res = await fetch('/api/admin/collections')
    const json = await res.json() as { collections: Collection[] }
    setCollections(json.collections ?? [])
    setLoading(false)
  }

  async function handleCreate() {
    if (!newForm.handle || !newForm.title) return
    setSaving(true)
    await fetch('/api/admin/collections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newForm),
    })
    setNewForm({ handle: '', title: '', description: '' })
    setShowNew(false)
    setSaving(false)
    fetchCollections()
  }

  async function handleUpdate(id: string) {
    setSaving(true)
    await fetch('/api/admin/collections', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...editData }),
    })
    setEditingId(null)
    setSaving(false)
    fetchCollections()
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this collection?')) return
    await fetch('/api/admin/collections', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    fetchCollections()
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Collections</h1>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">
          <Plus className="h-4 w-4" /> Add Collection
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Handle</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {showNew && (
              <tr className="bg-blue-50">
                <td className="px-4 py-3">
                  <input value={newForm.title} onChange={e => setNewForm(p => ({ ...p, title: e.target.value }))}
                    placeholder="Title" className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                </td>
                <td className="px-4 py-3">
                  <input value={newForm.handle} onChange={e => setNewForm(p => ({ ...p, handle: e.target.value }))}
                    placeholder="handle" className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                </td>
                <td className="px-4 py-3 text-gray-400">—</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={handleCreate} disabled={saving} className="text-green-600 hover:text-green-700">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={() => setShowNew(false)} className="text-red-400 hover:text-red-600">
                    <X className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            )}
            {collections.map(col => (
              <tr key={col.id}>
                <td className="px-4 py-3">
                  {editingId === col.id ? (
                    <input value={editData.title ?? col.title} onChange={e => setEditData(p => ({ ...p, title: e.target.value }))}
                      className="border border-gray-300 rounded px-2 py-1 text-sm w-full" />
                  ) : (
                    <span className="font-medium text-gray-900">{col.title}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500">{col.handle}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {col.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {editingId === col.id ? (
                    <div className="flex gap-2">
                      <button onClick={() => handleUpdate(col.id)} className="text-green-600"><Check className="h-4 w-4" /></button>
                      <button onClick={() => setEditingId(null)} className="text-red-400"><X className="h-4 w-4" /></button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingId(col.id); setEditData({ title: col.title }) }} className="text-blue-600">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(col.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: app/admin/orders/page.tsx 생성**

```typescript
'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/utils'

interface Order {
  id: string
  customer_email: string
  customer_name: string | null
  status: string
  total: number
  subtotal: number
  created_at: string
  stripe_payment_intent: string | null
  order_lines: { title: string; quantity: number; price: number }[]
}

const STATUSES = ['paid','processing','shipped','delivered','refunded','cancelled']
const STATUS_COLORS: Record<string, string> = {
  paid: 'bg-green-100 text-green-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-gray-100 text-gray-700',
  refunded: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    const res = await fetch('/api/admin/orders')
    const json = await res.json() as { orders: Order[] }
    setOrders(json.orders ?? [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    setUpdating(id)
    await fetch(`/api/admin/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    setUpdating(null)
    fetchOrders()
  }

  async function handleRefund(id: string) {
    if (!confirm('Issue full refund via Stripe?')) return
    setUpdating(id)
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'POST' })
    const json = await res.json() as { error?: string }
    if (!res.ok) alert(json.error ?? 'Refund failed')
    setUpdating(null)
    fetchOrders()
  }

  if (loading) return <div className="text-gray-400 text-sm">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Customer</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Total</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Date</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No orders yet</td></tr>
            )}
            {orders.map(order => (
              <>
                <tr key={order.id} className="cursor-pointer hover:bg-gray-50" onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.customer_email}</p>
                    {order.customer_name && <p className="text-xs text-gray-400">{order.customer_name}</p>}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{formatPrice(Number(order.total))}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[order.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(order.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 flex gap-2" onClick={e => e.stopPropagation()}>
                    <select
                      value={order.status}
                      disabled={updating === order.id}
                      onChange={e => updateStatus(order.id, e.target.value)}
                      className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none"
                    >
                      {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {order.stripe_payment_intent && order.status !== 'refunded' && (
                      <button onClick={() => handleRefund(order.id)} disabled={updating === order.id}
                        className="text-xs text-red-600 border border-red-200 rounded px-2 py-1 hover:bg-red-50 disabled:opacity-50">
                        Refund
                      </button>
                    )}
                  </td>
                </tr>
                {expandedId === order.id && (
                  <tr key={`${order.id}-detail`}>
                    <td colSpan={5} className="px-4 py-3 bg-gray-50">
                      <table className="w-full text-xs">
                        <thead><tr>
                          <th className="text-left text-gray-500 font-medium pb-1">Item</th>
                          <th className="text-left text-gray-500 font-medium pb-1">Qty</th>
                          <th className="text-left text-gray-500 font-medium pb-1">Price</th>
                        </tr></thead>
                        <tbody>{order.order_lines.map((line, i) => (
                          <tr key={i}>
                            <td className="text-gray-700">{line.title}</td>
                            <td className="text-gray-700">{line.quantity}</td>
                            <td className="text-gray-700">{formatPrice(line.price)}</td>
                          </tr>
                        ))}</tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: app/admin/subscribers/page.tsx 생성**

```typescript
import { createAdminClient } from '@/lib/supabase/admin-client'

async function getSubscribers() {
  const db = createAdminClient()
  const { data, count } = await db
    .from('newsletter_subscribers')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  return { subscribers: data ?? [], count: count ?? 0 }
}

export default async function AdminSubscribersPage() {
  const { subscribers, count } = await getSubscribers()

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Newsletter Subscribers</h1>
        <span className="text-sm text-gray-500">{count} total</span>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
              <th className="text-left px-4 py-3 text-gray-600 font-medium">Subscribed At</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {subscribers.length === 0 && (
              <tr><td colSpan={2} className="px-4 py-8 text-center text-gray-400">No subscribers yet</td></tr>
            )}
            {subscribers.map(sub => (
              <tr key={sub.id}>
                <td className="px-4 py-3 text-gray-900">{sub.email}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(sub.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/collections/ app/admin/orders/ app/admin/subscribers/
git commit -m "feat: admin collections, orders, subscribers pages"
```

---

## Task 10: Stripe 결제 연동

**Files:**
- Create: `lib/stripe.ts`
- Create: `app/api/checkout/route.ts`
- Create: `app/api/stripe/webhook/route.ts`
- Create: `app/checkout/success/page.tsx`
- Create: `app/checkout/cancel/page.tsx`
- Modify: `app/cart/page.tsx`

- [ ] **Step 1: stripe 패키지 설치**

```bash
npm install stripe
```

Expected: stripe 패키지 설치 완료

- [ ] **Step 2: lib/stripe.ts 생성**

```typescript
import Stripe from 'stripe'

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error('Missing STRIPE_SECRET_KEY')
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}
```

- [ ] **Step 3: app/api/checkout/route.ts 생성**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCartBySessionId } from '@/lib/supabase/cart'
import { getStripe } from '@/lib/stripe'

const SESSION_COOKIE = 'pawnova_session'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const sessionId = cookieStore.get(SESSION_COOKIE)?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'No cart session' }, { status: 400 })
    }

    const cart = await getCartBySessionId(sessionId)
    if (!cart || cart.lines.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }

    const stripe = getStripe()
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? request.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: cart.lines.map(line => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: line.productTitle,
            description: line.variantTitle !== 'Default' ? line.variantTitle : undefined,
            images: line.image ? [line.image.url] : [],
          },
          unit_amount: Math.round(line.price * 100),
        },
        quantity: line.quantity,
      })),
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
      metadata: { pawnova_session_id: sessionId },
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Checkout failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
```

- [ ] **Step 4: app/api/stripe/webhook/route.ts 생성**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createServerClient } from '@/lib/supabase/client'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    await handleCheckoutComplete(session)
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const db = createServerClient()
  const stripe = getStripe()

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, { expand: ['data.price.product'] })
  const sessionId = session.metadata?.pawnova_session_id

  // 장바구니 아이템으로 order_lines 구성
  let cartLines: { title: string; variant_title: string | null; price: number; quantity: number; product_id: string | null; variant_id: string | null; image_url: string | null }[] = []

  if (sessionId) {
    const { data: cart } = await db.from('carts').select('id').eq('session_id', sessionId).single()
    if (cart) {
      const { data: lines } = await db
        .from('cart_lines')
        .select(`
          quantity,
          product_variants (
            id, title, price, product_id,
            products (id, title),
            image_url
          )
        `)
        .eq('cart_id', cart.id)

      cartLines = (lines ?? []).map((line: Record<string, unknown>) => {
        const variant = line.product_variants as Record<string, unknown>
        const product = variant?.products as Record<string, unknown> | null
        return {
          title: product?.title as string ?? 'Product',
          variant_title: variant?.title as string ?? null,
          price: variant?.price as number ?? 0,
          quantity: line.quantity as number,
          product_id: product?.id as string ?? null,
          variant_id: variant?.id as string ?? null,
          image_url: variant?.image_url as string ?? null,
        }
      })
    }
  }

  // orders 테이블에 저장
  const { data: order } = await db.from('orders').insert({
    stripe_session_id: session.id,
    stripe_payment_intent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    customer_email: session.customer_details?.email ?? '',
    customer_name: session.customer_details?.name ?? null,
    status: 'paid',
    subtotal: (session.amount_subtotal ?? 0) / 100,
    total: (session.amount_total ?? 0) / 100,
    shipping_address: session.shipping_details?.address ?? null,
  }).select().single()

  if (order && cartLines.length) {
    await db.from('order_lines').insert(
      cartLines.map(line => ({
        order_id: order.id,
        product_id: line.product_id,
        variant_id: line.variant_id,
        title: line.title,
        variant_title: line.variant_title,
        quantity: line.quantity,
        price: line.price,
        image_url: line.image_url,
      }))
    )
  }

  // 장바구니 비우기
  if (sessionId) {
    const { data: cart } = await db.from('carts').select('id').eq('session_id', sessionId).single()
    if (cart) {
      await db.from('cart_lines').delete().eq('cart_id', cart.id)
    }
  }
}
```

- [ ] **Step 5: app/checkout/success/page.tsx 생성**

```typescript
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          Order Confirmed!
        </h1>
        <p className="text-gray-500 mb-8">
          Thank you for your purchase. You&apos;ll receive a confirmation email shortly.
        </p>
        <Link href="/shop" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700">
          Continue Shopping
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: app/checkout/cancel/page.tsx 생성**

```typescript
import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text)' }}>
          Payment Cancelled
        </h1>
        <p className="text-gray-500 mb-8">
          Your order was not placed. Your cart has been saved.
        </p>
        <Link href="/cart" className="inline-block bg-gray-900 text-white px-6 py-3 rounded-full font-medium hover:bg-gray-700">
          Back to Cart
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: app/cart/page.tsx의 handleCheckout 수정**

`handleCheckout` 함수를 다음으로 교체:

```typescript
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
```

- [ ] **Step 8: Stripe webhook 로컬 테스트 설정**

```bash
# Stripe CLI로 로컬 webhook 포워딩 (개발 시)
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Stripe Dashboard → Webhooks → Add endpoint:
- URL: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`
- Copy webhook signing secret → `.env.local`의 `STRIPE_WEBHOOK_SECRET`에 저장

- [ ] **Step 9: Commit**

```bash
git add lib/stripe.ts app/api/checkout/ app/api/stripe/ app/checkout/ app/cart/page.tsx
git commit -m "feat: Stripe checkout and webhook order processing"
```

---

## Task 11: 빌드 검증

**Files:**
- Modify: `next.config.ts` (필요 시)

- [ ] **Step 1: TypeScript 체크**

```bash
cd /c/Web/Drop/pawnova && npx tsc --noEmit
```

Expected: 에러 없음. 에러 발생 시 타입 오류 수정.

- [ ] **Step 2: Next.js 빌드**

```bash
cd /c/Web/Drop/pawnova && npm run build
```

Expected: `Route (app)` 테이블 출력 후 "Compiled successfully"

- [ ] **Step 3: 알려진 빌드 이슈 체크리스트**

빌드 실패 시 확인:
- `@supabase/ssr` import 에러 → `npm install @supabase/ssr@latest`
- `stripe` import 에러 → `npm install stripe`
- `cookies()` 동기 호출 에러 → `await cookies()` 확인
- `params` 타입 에러 → `params: Promise<{id: string}>` + `await params` 확인

- [ ] **Step 4: Final Commit**

```bash
git add -A
git commit -m "feat: complete admin panel + Stripe integration"
```

---

## 환경변수 체크리스트

`.env.local`에 다음이 모두 설정되어야 합니다:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SITE_URL=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```
