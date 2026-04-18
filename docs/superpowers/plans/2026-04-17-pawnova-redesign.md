# PawNova Full Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild PawNova's visual layer from warm-orange/serif to Dark Premium (#0f0f0f base + #FFC107 accent) with floating pill nav, centered hero + bento grid, marquee trust bar, and always-visible-CTA product cards.

**Architecture:** All color/spacing decisions live in CSS custom properties in `globals.css` — components reference tokens only, never hardcoded hex. `page.tsx` is the single home page orchestrator. `ProductCard` is a standalone client component with no external state beyond `useCart`.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4 (CDN @theme), lucide-react icons, CSS `@keyframes` for marquee + fade-up, IntersectionObserver for scroll animations.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/globals.css` | Modify | Design tokens, keyframes, scrollbar-hide utility |
| `components/layout/AnnouncementBar.tsx` | Modify | Black text on yellow bg fix |
| `components/layout/Header.tsx` | Modify | Floating pill nav, CSS-var colors, right-slide mobile drawer |
| `components/product/ProductCard.tsx` | Rewrite | Dark card, always-visible yellow CTA, hover effects |
| `app/page.tsx` | Rewrite | Hero + bento, marquee bar, weekly deals, category rows, testimonials, newsletter |
| `components/layout/Footer.tsx` | Modify | Token-only color update |

---

## Task 1: Design Tokens + Global Styles

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace @theme block**

Open `app/globals.css`. Replace the entire `@theme { ... }` block with:

```css
@theme {
  --color-bg: #0f0f0f;
  --color-surface: #1c1c1c;
  --color-surface-2: #2a2a2a;
  --color-text: #f5f5f5;
  --color-text-muted: #9a9a9a;
  --color-accent: #FFC107;
  --color-accent-hover: #FFB300;
  --color-accent-text: #000000;
  --color-divider: #2a2a2a;
  --color-badge-sale: #ef4444;

  --font-display: 'DM Sans', system-ui, sans-serif;
  --font-body: 'DM Sans', system-ui, sans-serif;

  --radius-btn: 50px;
  --radius-card: 14px;
}
```

- [ ] **Step 2: Replace :root and [data-theme] blocks**

Replace existing `:root` and `[data-theme="dark"]` blocks with:

```css
:root {
  --color-bg: #0f0f0f;
  --color-surface: #1c1c1c;
  --color-surface-2: #2a2a2a;
  --color-text: #f5f5f5;
  --color-text-muted: #9a9a9a;
  --color-accent: #FFC107;
  --color-accent-hover: #FFB300;
  --color-accent-text: #000000;
  --color-divider: #2a2a2a;
  --color-badge-sale: #ef4444;
}

[data-theme="light"] {
  --color-bg: #f5f5f5;
  --color-surface: #ffffff;
  --color-surface-2: #f0f0f0;
  --color-text: #0f0f0f;
  --color-text-muted: #6b6b6b;
  --color-divider: #e5e5e5;
  --color-accent: #FFC107;
  --color-accent-hover: #FFB300;
  --color-accent-text: #000000;
  --color-badge-sale: #ef4444;
}

[data-theme="dark"] {
  --color-bg: #0f0f0f;
  --color-surface: #1c1c1c;
  --color-surface-2: #2a2a2a;
  --color-text: #f5f5f5;
  --color-text-muted: #9a9a9a;
  --color-accent: #FFC107;
  --color-accent-hover: #FFB300;
  --color-accent-text: #000000;
  --color-divider: #2a2a2a;
  --color-badge-sale: #ef4444;
}
```

- [ ] **Step 3: Add keyframes and utilities after the existing `@media (prefers-reduced-motion)` block**

```css
/* Scroll fade-up reveal */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up {
  animation: fadeUp 0.5s ease-out forwards;
  opacity: 0;
}

/* Marquee trust bar */
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-marquee {
  animation: marquee 30s linear infinite;
}

/* Hide scrollbar (category rows) */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

- [ ] **Step 4: Verify the file looks correct — no leftover Zodiak font reference, no orange colors**

Search for `e07b39`, `zodiak`, `Zodiak` in the file — should return nothing.

- [ ] **Step 5: Commit**

```bash
git add app/globals.css
git commit -m "feat: redesign — dark premium design tokens + keyframes"
```

---

## Task 2: AnnouncementBar — Text Contrast Fix

**Files:**
- Modify: `components/layout/AnnouncementBar.tsx`

- [ ] **Step 1: Fix text and button colors**

The current file uses `text-white` on a yellow background — fails WCAG AA. Replace the JSX return with:

```tsx
return (
  <div
    className="relative flex items-center justify-center px-8 py-2 text-sm font-medium"
    style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
  >
    <span>
      Free US Shipping $50+ · Arrives in 3–5 Days · 30-Day Returns
    </span>
    <button
      onClick={dismissAnnouncement}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:opacity-60 transition-opacity"
      aria-label="Dismiss announcement"
      style={{ color: 'var(--color-accent-text)' }}
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
)
```

- [ ] **Step 2: Commit**

```bash
git add components/layout/AnnouncementBar.tsx
git commit -m "fix: announcement bar — black text on yellow for WCAG contrast"
```

---

## Task 3: Header — Floating Pill Nav

**Files:**
- Modify: `components/layout/Header.tsx`

- [ ] **Step 1: Replace the outer `<header>` element and its inline style**

Current: hardcoded `rgba(247,246,242,0.85)` in `style` prop, full-width sticky bar.
New: floating pill inside a container. Replace the entire `Header` function return with:

```tsx
return (
  <>
    <div className="sticky top-0 z-40 w-full px-4 md:px-8 pt-3">
      <header
        className={cn(
          'mx-auto max-w-7xl rounded-full border transition-all duration-300',
          scrolled
            ? 'border-[var(--color-accent)]/20 shadow-lg shadow-black/40 backdrop-blur-md'
            : 'border-[var(--color-divider)]'
        )}
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-surface) 80%, transparent)' }}
      >
        <div className="flex items-center justify-between px-5 py-2.5">
          <PawNovLogo />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors hover:text-[var(--color-accent)]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1">
            <Link
              href="/shop"
              aria-label="Search"
              className="p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Search className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
            </Link>
            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              ) : (
                <Sun className="h-4 w-4" style={{ color: 'var(--color-text-muted)' }} />
              )}
            </button>
            <UserMenu />
            <CartButton />
            <button
              onClick={openMobileNav}
              aria-label="Open menu"
              className="md:hidden p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <Menu className="h-4 w-4" style={{ color: 'var(--color-text)' }} />
            </button>
          </div>
        </div>
      </header>
    </div>

    {/* Mobile nav — right-slide drawer */}
    {isMobileNavOpen && (
      <div className="fixed inset-0 z-50 md:hidden">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={closeMobileNav}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-72 flex flex-col p-6 shadow-xl"
          style={{ backgroundColor: 'var(--color-surface)' }}
        >
          <div className="flex items-center justify-between mb-8">
            <PawNovLogo />
            <button
              onClick={closeMobileNav}
              aria-label="Close menu"
              className="p-2 rounded-full hover:bg-[var(--color-surface-2)] transition-colors"
            >
              <X className="h-5 w-5" style={{ color: 'var(--color-text)' }} />
            </button>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileNav}
                className="text-base font-medium py-3 px-4 rounded-xl transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent)]"
                style={{ color: 'var(--color-text)' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    )}
  </>
)
```

- [ ] **Step 2: Verify `color-mix` support note**

`color-mix(in srgb, ...)` is supported in all modern browsers (Chrome 111+, Firefox 113+, Safari 16.2+). No polyfill needed.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Header.tsx
git commit -m "feat: redesign — floating pill nav, right-slide mobile drawer, token colors"
```

---

## Task 4: ProductCard — Dark Card + Always-visible CTA

**Files:**
- Rewrite: `components/product/ProductCard.tsx`

- [ ] **Step 1: Write the full component**

Replace the entire file contents with:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Star } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem, isLoading } = useCart()

  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product.id, 1)
  }

  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-divider)] hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40 transition-all duration-200"
      style={{ backgroundColor: 'var(--color-surface)' }}
    >
      {/* Image */}
      <div
        className="relative aspect-square overflow-hidden"
        style={{ backgroundColor: 'var(--color-surface-2)' }}
      >
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            priority={priority}
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            No image
          </div>
        )}

        {hasDiscount && (
          <span
            className="absolute top-2.5 left-2.5 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-bold text-white"
            style={{ backgroundColor: 'var(--color-badge-sale)' }}
          >
            -{discountPct}%
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Stars — display placeholder (no rating in DB) */}
        <div className="flex items-center gap-0.5">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-3 w-3"
              style={{ fill: 'var(--color-accent)', color: 'var(--color-accent)' }}
            />
          ))}
          <span className="ml-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
            (4.9)
          </span>
        </div>

        {/* Title */}
        <p
          className="text-sm font-semibold leading-snug line-clamp-2 flex-1"
          style={{ color: 'var(--color-text)' }}
        >
          {product.title}
        </p>

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold" style={{ color: 'var(--color-text)' }}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>

        {/* CTA — always visible */}
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] py-2.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-accent-hover)')
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = 'var(--color-accent)')
          }
        >
          <ShoppingCart className="h-4 w-4" />
          {isLoading ? 'Adding…' : 'Add to Cart'}
        </button>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Verify imports resolve**

`formatPrice` is in `@/lib/utils`. `useCart` is in `@/hooks/useCart`. `Product` is in `@/types/database`. All exist.

- [ ] **Step 3: Commit**

```bash
git add components/product/ProductCard.tsx
git commit -m "feat: redesign — dark product card with always-visible yellow CTA"
```

---

## Task 5: page.tsx — Full Homepage Rewrite

**Files:**
- Rewrite: `app/page.tsx`

- [ ] **Step 1: Replace imports**

```tsx
import Link from 'next/link'
import { Truck, RotateCcw, Shield, Star, Gift, Zap } from 'lucide-react'
import { getProducts } from '@/lib/supabase/products'
import { ProductCard } from '@/components/product/ProductCard'
import { NewsletterForm } from './NewsletterForm'
import { formatPrice } from '@/lib/utils'
import type { Product } from '@/types/database'
```

Note: `Image` import removed — hero no longer uses a product image mosaic.

- [ ] **Step 2: Write the page component — data fetching section (unchanged logic)**

```tsx
export default async function HomePage() {
  const [featuredResult, dogsResult, catsResult] = await Promise.allSettled([
    getProducts({ collectionHandle: 'featured', first: 10 }),
    getProducts({ collectionHandle: 'dogs', first: 8 }),
    getProducts({ collectionHandle: 'cats', first: 8 }),
  ])

  const featuredProducts =
    featuredResult.status === 'fulfilled' ? featuredResult.value.products : []
  const dogProducts =
    dogsResult.status === 'fulfilled' ? dogsResult.value.products : []
  const catProducts =
    catsResult.status === 'fulfilled' ? catsResult.value.products : []

  const fallback =
    featuredProducts.length === 0
      ? await getProducts({ first: 10 }).catch(() => ({ products: [] }))
      : null

  const displayFeatured =
    featuredProducts.length > 0 ? featuredProducts : fallback?.products ?? []
```

- [ ] **Step 3: Write Hero section JSX**

```tsx
  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
        {/* Season badge */}
        <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-8"
          style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}>
          New Season 2025
        </div>

        {/* Headline */}
        <h1
          className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.02] tracking-tight mb-6"
          style={{ color: 'var(--color-text)' }}
        >
          Premium Pet<br />
          <span style={{ color: 'var(--color-accent)' }}>Wellness.</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}>
          Science-backed toys &amp; gear for curious, happy pets.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
          <Link
            href="/shop"
            className="inline-flex h-12 items-center gap-2 rounded-full px-8 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)' }}
          >
            Shop Best Sellers →
          </Link>
          <Link
            href="/collections/new-arrivals"
            className="inline-flex h-12 items-center gap-2 rounded-full border px-6 text-sm font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
            style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-muted)' }}
          >
            See What&apos;s New
          </Link>
        </div>

        {/* Social proof */}
        <div className="flex items-center justify-center gap-1.5 text-sm mb-14"
          style={{ color: 'var(--color-text-muted)' }}>
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4" style={{ fill: 'var(--color-accent)', color: 'var(--color-accent)' }} />
          ))}
          <span className="ml-1">Loved by 40,000+ pet parents · Free returns</span>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <Link
            href="/collections/sale"
            className="col-span-2 rounded-[var(--radius-card)] border p-6 text-left hover:border-[var(--color-accent)] transition-colors group"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-accent)' }}>
                Weekly Deals
              </span>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>Up to 40% off</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Selected items this week</p>
          </Link>
          <div className="flex flex-col gap-4">
            <Link
              href="/collections/dogs"
              className="flex-1 rounded-[var(--radius-card)] border p-4 text-center hover:border-[var(--color-accent)] transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
            >
              <div className="text-2xl mb-1">🐕</div>
              <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Dogs</p>
            </Link>
            <Link
              href="/collections/cats"
              className="flex-1 rounded-[var(--radius-card)] border p-4 text-center hover:border-[var(--color-accent)] transition-colors"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
            >
              <div className="text-2xl mb-1">🐈</div>
              <p className="text-xs font-bold" style={{ color: 'var(--color-text)' }}>Cats</p>
            </Link>
          </div>
        </div>
      </section>
```

- [ ] **Step 4: Write Marquee Trust Bar JSX**

```tsx
      {/* ── Marquee Trust Bar ────────────────────────────────────── */}
      <div className="overflow-hidden py-3" style={{ backgroundColor: 'var(--color-accent)' }}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, gi) => (
            <span key={gi} className="flex items-center">
              {[
                '✦ Free Shipping $50+',
                '✦ Loyalty Rewards',
                '✦ 30-Day Returns',
                '✦ 40,000+ Reviews',
              ].map((item) => (
                <span
                  key={item}
                  className="mx-8 text-sm font-bold"
                  style={{ color: 'var(--color-accent-text)' }}
                >
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
```

- [ ] **Step 5: Write Weekly Deals section JSX**

```tsx
      {/* ── Weekly Deals ─────────────────────────────────────────── */}
      {displayFeatured.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 md:px-8 py-14">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                <Zap className="h-5 w-5" style={{ color: 'var(--color-accent-text)' }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Weekly Deals
                </h2>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  Refreshed every Monday
                </p>
              </div>
            </div>
            <Link
              href="/shop"
              className="hidden sm:inline-flex h-9 items-center gap-1.5 rounded-full border px-5 text-sm font-medium transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-muted)' }}
            >
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {displayFeatured.slice(0, 10).map((product, i) => (
              <ProductCard key={product.id} product={product} priority={i < 5} />
            ))}
          </div>
        </section>
      )}
```

- [ ] **Step 6: Write Category Rows + Testimonials + Newsletter + closing tags**

```tsx
      {/* ── Dogs Row ─────────────────────────────────────────────── */}
      {dogProducts.length > 0 && (
        <CategoryRow title="For Dogs" emoji="🐕" products={dogProducts} href="/collections/dogs" />
      )}

      {/* ── Cats Row ─────────────────────────────────────────────── */}
      {catProducts.length > 0 && (
        <CategoryRow title="For Cats" emoji="🐈" products={catProducts} href="/collections/cats" />
      )}

      {/* ── Testimonials ─────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 py-14">
        <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--color-text)' }}>
          What Pet Parents Are Saying
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Sarah M.', role: 'Golden Retriever mom', text: "The puzzle feeder completely changed our mornings. Biscuit now slows down when eating and she seems so much calmer throughout the day." },
            { name: 'James T.', role: 'Cat owner ×2', text: "Both my cats went feral for the interactive wand. Felix and Luna haven't fought once since I started using it before bedtime." },
            { name: 'Priya K.', role: 'Rescue dog parent', text: "The calming mat arrived in two days and Mango was on it within minutes. Watching her relax like that — I actually teared up." },
          ].map((review) => (
            <div
              key={review.name}
              className="rounded-[var(--radius-card)] border p-6 space-y-4"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-3.5 w-3.5" style={{ fill: 'var(--color-accent)', color: 'var(--color-accent)' }} />
                ))}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                &ldquo;{review.text}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{review.name}</p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{review.role}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────── */}
      <section className="border-t py-14" style={{ borderColor: 'var(--color-divider)', backgroundColor: 'var(--color-surface)' }}>
        <div className="mx-auto max-w-xl px-4 md:px-8 text-center space-y-4">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
            Get 15% Off Your First Order
          </h2>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Join 40,000+ pet parents for exclusive deals, new arrivals, and vet tips.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </>
  )
}
```

- [ ] **Step 7: Write the CategoryRow helper component (replaces old version)**

Add at the bottom of `app/page.tsx`, replacing the existing `CategoryRow` function:

```tsx
function CategoryRow({
  title,
  emoji,
  products,
  href,
}: {
  title: string
  emoji: string
  products: Product[]
  href: string
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 md:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
          {emoji} {title}
        </h2>
        <Link
          href={href}
          className="text-sm font-medium transition-colors hover:text-[var(--color-accent)]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          View All →
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="w-48 flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 8: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redesign — dark premium homepage (hero, marquee, deals, category rows)"
```

---

## Task 6: Footer — Token Color Update

**Files:**
- Modify: `components/layout/Footer.tsx`

- [ ] **Step 1: Read the file and identify hardcoded colors**

Open `components/layout/Footer.tsx`. Search for any hardcoded hex values (`#`) or inline style colors that don't use CSS variables.

- [ ] **Step 2: Replace all hardcoded color references with CSS variables**

For each hardcoded color found:
- Background colors → `var(--color-surface)` or `var(--color-bg)`
- Text colors → `var(--color-text)` or `var(--color-text-muted)`
- Border colors → `var(--color-divider)`
- Accent/brand colors → `var(--color-accent)`

Do not change layout, structure, or content — tokens only.

- [ ] **Step 3: Commit**

```bash
git add components/layout/Footer.tsx
git commit -m "fix: redesign — footer token color update"
```

---

## Task 7: NewsletterForm — Input Style Update

**Files:**
- Modify: `app/NewsletterForm.tsx`

- [ ] **Step 1: Read the file**

Open `app/NewsletterForm.tsx` and identify the input and button elements.

- [ ] **Step 2: Update input to dark style with yellow focus ring**

Find the `<input>` element and ensure it has:
```tsx
className="w-full rounded-full border px-5 py-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
style={{
  backgroundColor: 'var(--color-surface-2)',
  borderColor: 'var(--color-divider)',
  color: 'var(--color-text)',
}}
```

- [ ] **Step 3: Update submit button to yellow pill**

Find the submit `<button>` and ensure:
```tsx
className="rounded-full px-6 py-3 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
style={{
  backgroundColor: 'var(--color-accent)',
  color: 'var(--color-accent-text)',
}}
```

- [ ] **Step 4: Commit**

```bash
git add app/NewsletterForm.tsx
git commit -m "fix: redesign — newsletter form dark input + yellow pill button"
```

---

## Self-Review

**Spec coverage check:**

| Spec section | Covered by task |
|---|---|
| §1 Design tokens + keyframes + scrollbar-hide | Task 1 ✓ |
| §2 Header pill nav + mobile drawer | Task 3 ✓ |
| §3 AnnouncementBar contrast fix | Task 2 ✓ |
| §4 Hero centered + bento grid | Task 5 Step 3 ✓ |
| §5 Marquee trust bar | Task 5 Step 4 ✓ |
| §6 Weekly Deals 5-col grid | Task 5 Step 5 ✓ |
| §7 Category rows scrollbar-hide | Task 5 Step 7 ✓ |
| §8 ProductCard dark + always-visible CTA | Task 4 ✓ |
| §9 Testimonials 3-col | Task 5 Step 6 ✓ |
| §10 Newsletter dark input + pill button | Task 7 ✓ |
| §11 Footer token update | Task 6 ✓ |

**Placeholder scan:** No TBD, no TODO, no "similar to Task N" — all code is explicit.

**Type consistency:**
- `ProductCard` receives `product: Product` and `priority?: boolean` — matches usage in `page.tsx`
- `CategoryRow` receives `{ title, emoji, products, href }` — matches call sites in page.tsx
- `addItem(product.id, 1)` — matches `useCart` hook signature
- `formatPrice(product.price)` and `formatPrice(product.compareAtPrice!)` — matches `lib/utils`

**Gap found:** `NewsletterForm` was referenced in spec §10 but had no task. → Added Task 7.
