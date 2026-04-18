import Link from 'next/link'
import { Star, Zap } from 'lucide-react'
import { getProducts } from '@/lib/supabase/products'
import { ProductCard } from '@/components/product/ProductCard'
import { NewsletterForm } from './NewsletterForm'
import type { Product } from '@/types/database'

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

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 md:px-8 pt-16 pb-12 md:pt-24 md:pb-16 text-center">
        {/* Season badge */}
        <div
          className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-bold tracking-widest uppercase mb-8"
          style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
        >
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
        <p
          className="text-base md:text-lg max-w-xl mx-auto mb-8 leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
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
        <div
          className="flex items-center justify-center gap-1.5 text-sm mb-14"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              className="h-4 w-4"
              style={{ fill: 'var(--color-accent)', color: 'var(--color-accent)' }}
            />
          ))}
          <span className="ml-1">Loved by 40,000+ pet parents · Free returns</span>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <Link
            href="/collections/sale"
            className="col-span-2 rounded-[var(--radius-card)] border p-6 text-left hover:border-[var(--color-accent)] transition-colors"
            style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4" style={{ color: 'var(--color-accent)' }} />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--color-accent)' }}
              >
                Weekly Deals
              </span>
            </div>
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
              Up to 40% off
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
              Selected items this week
            </p>
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
        <h2 className="text-2xl md:text-3xl font-bold mb-8" style={{ color: 'var(--color-text)' }}>
          What Pet Parents Are Saying
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Sarah M.',
              role: 'Golden Retriever mom',
              text: 'The puzzle feeder completely changed our mornings. Biscuit now slows down when eating and she seems so much calmer throughout the day.',
            },
            {
              name: 'James T.',
              role: 'Cat owner ×2',
              text: "Both my cats went feral for the interactive wand. Felix and Luna haven't fought once since I started using it before bedtime.",
            },
            {
              name: 'Priya K.',
              role: 'Rescue dog parent',
              text: 'The calming mat arrived in two days and Mango was on it within minutes. Watching her relax like that — I actually teared up.',
            },
          ].map((review) => (
            <div
              key={review.name}
              className="rounded-[var(--radius-card)] border p-6 space-y-4"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
            >
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-3.5 w-3.5"
                    style={{ fill: 'var(--color-accent)', color: 'var(--color-accent)' }}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                &ldquo;{review.text}&rdquo;
              </p>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>
                  {review.name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {review.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Newsletter ───────────────────────────────────────────── */}
      <section
        className="border-t py-14"
        style={{ borderColor: 'var(--color-divider)', backgroundColor: 'var(--color-surface)' }}
      >
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
        <h2
          className="text-2xl font-bold flex items-center gap-2"
          style={{ color: 'var(--color-text)' }}
        >
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
          <div key={product.id} className="w-52 flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </section>
  )
}
