import Link from 'next/link'
import { ArrowRight, Zap, Shield, RotateCcw, Truck } from 'lucide-react'
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
      {/* ── Hero ── */}
      <section className="relative overflow-hidden" style={{ backgroundColor: 'var(--color-bg)' }}>
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,149,10,0.07) 0%, transparent 70%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-6 md:px-10 pt-20 pb-24 md:pt-28 md:pb-32">
          <div className="flex justify-center mb-8">
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-bold tracking-[0.18em] uppercase"
              style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)', backgroundColor: 'var(--color-accent-subtle)' }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: 'var(--color-accent)' }} />
              New Season 2025
            </span>
          </div>

          <h1
            className="text-center text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[1.0] tracking-[-0.03em] mb-6"
            style={{ color: 'var(--color-text)' }}
          >
            Premium Pet
            <br />
            <span style={{ color: 'var(--color-accent)' }}>Wellness.</span>
          </h1>

          <p
            className="text-center text-base md:text-lg max-w-lg mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Science-backed toys &amp; gear crafted for curious, happy pets.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-bold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-accent-text)', boxShadow: 'var(--shadow-btn)' }}
            >
              Shop Best Sellers
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/collections/new-arrivals"
              className="inline-flex items-center gap-2 rounded-full border px-6 py-3.5 text-sm font-medium transition-all duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
              style={{ borderColor: 'var(--color-divider-strong)', color: 'var(--color-text-muted)' }}
            >
              New Arrivals
            </Link>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs mb-16" style={{ color: 'var(--color-text-muted)' }}>
            <span style={{ color: 'var(--color-accent)', letterSpacing: '0.05em' }}>★★★★★</span>
            <span>4.9 · Trusted by 40,000+ pet parents · Free returns</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            <Link
              href="/collections/sale"
              className="sm:col-span-2 rounded-[var(--radius-card)] border p-6 text-left transition-all duration-200 hover:border-[var(--color-accent)]"
              style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                  <Zap className="h-3.5 w-3.5" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--color-accent)' }}>Weekly Deals</span>
              </div>
              <p className="text-lg font-black mb-1" style={{ color: 'var(--color-text)' }}>Up to 40% off</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Curated selection · refreshed every Monday</p>
            </Link>
            <div className="flex flex-col gap-3">
              <Link
                href="/collections/dogs"
                className="flex-1 rounded-[var(--radius-card)] border p-4 text-center transition-all duration-200 hover:border-[var(--color-accent)]"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
              >
                <div className="text-2xl mb-1.5">🐕</div>
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--color-text-secondary)' }}>Dogs</p>
              </Link>
              <Link
                href="/collections/cats"
                className="flex-1 rounded-[var(--radius-card)] border p-4 text-center transition-all duration-200 hover:border-[var(--color-accent)]"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
              >
                <div className="text-2xl mb-1.5">🐈</div>
                <p className="text-xs font-bold tracking-wide uppercase" style={{ color: 'var(--color-text-secondary)' }}>Cats</p>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust Bar ── */}
      <div className="overflow-hidden py-3.5" style={{ backgroundColor: 'var(--color-accent)' }}>
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, gi) => (
            <span key={gi} className="flex items-center">
              {[
                '✦ Free Shipping on $50+',
                '✦ 30-Day Returns',
                '✦ Vet-Approved Products',
                '✦ 40,000+ Happy Pets',
                '✦ Loyalty Rewards Program',
              ].map((item) => (
                <span key={item} className="mx-10 text-xs font-bold tracking-widest uppercase" style={{ color: 'var(--color-accent-text)' }}>
                  {item}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ── Featured Products ── */}
      {displayFeatured.length > 0 && (
        <section className="section-alt">
          <div className="mx-auto max-w-7xl px-6 md:px-10 py-20">
            <div className="flex items-end justify-between mb-10">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>Curated Selection</p>
                <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>Weekly Deals</h2>
              </div>
              <Link
                href="/shop"
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
                style={{ borderColor: 'var(--color-divider-strong)', color: 'var(--color-text-muted)' }}
              >
                View All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {displayFeatured.slice(0, 10).map((product, i) => (
                <ProductCard key={product.id} product={product} priority={i < 4} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Dogs ── */}
      {dogProducts.length > 0 && (
        <CategoryRow title="For Dogs" emoji="🐕" products={dogProducts} href="/collections/dogs" />
      )}

      {/* ── Cats ── */}
      {catProducts.length > 0 && (
        <section className="section-alt">
          <CategoryRow title="For Cats" emoji="🐈" products={catProducts} href="/collections/cats" inlined />
        </section>
      )}

      {/* ── Why PawNova ── */}
      <section style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>Our Promise</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>Why Pet Parents Choose Us</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Truck, title: 'Free Shipping', desc: 'On all orders $50+. Fast 3–5 day delivery.' },
              { icon: RotateCcw, title: '30-Day Returns', desc: 'Not happy? Send it back, no questions asked.' },
              { icon: Shield, title: 'Vet-Approved', desc: 'Every product reviewed by licensed vets.' },
              { icon: Zap, title: 'Weekly Deals', desc: 'New discounts on premium items every Monday.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-[var(--radius-card)] border p-6 text-center"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full mb-4" style={{ backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)' }}>
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--color-text)' }}>{title}</p>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="section-alt">
        <div className="mx-auto max-w-7xl px-6 md:px-10 py-20">
          <div className="text-center mb-12">
            <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--color-accent)' }}>Real Reviews</p>
            <h2 className="text-3xl md:text-4xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>What Pet Parents Are Saying</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Sarah M.', role: 'Golden Retriever mom', text: 'The puzzle feeder completely changed our mornings. Biscuit slows down when eating and seems so much calmer throughout the day.' },
              { name: 'James T.', role: 'Cat owner ×2', text: "Both my cats went wild for the interactive wand. Felix and Luna haven't fought once since I started using it before bedtime." },
              { name: 'Priya K.', role: 'Rescue dog parent', text: 'The calming mat arrived in two days and Mango was on it within minutes. Watching her relax like that — I actually teared up.' },
            ].map((review) => (
              <div
                key={review.name}
                className="rounded-[var(--radius-card)] border p-7 flex flex-col gap-4"
                style={{ backgroundColor: 'var(--color-surface)', borderColor: 'var(--color-divider)' }}
              >
                <span className="text-sm tracking-wide" style={{ color: 'var(--color-accent)' }}>★★★★★</span>
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'var(--color-text-secondary)' }}>&ldquo;{review.text}&rdquo;</p>
                <div className="border-t pt-4" style={{ borderColor: 'var(--color-divider)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--color-text)' }}>{review.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>{review.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Newsletter ── */}
      <section style={{ backgroundColor: 'var(--color-bg)' }}>
        <div className="mx-auto max-w-xl px-6 md:px-10 py-20 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: 'var(--color-accent)' }}>Join the Club</p>
          <h2 className="text-3xl font-black tracking-tight mb-3" style={{ color: 'var(--color-text)' }}>Get 15% Off Your First Order</h2>
          <p className="text-sm mb-8 leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Join 40,000+ pet parents for exclusive deals, new arrivals, and vet-approved tips.
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
  inlined = false,
}: {
  title: string
  emoji: string
  products: Product[]
  href: string
  inlined?: boolean
}) {
  const content = (
    <div className="mx-auto max-w-7xl px-6 md:px-10 py-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--color-accent)' }}>
            {emoji} Collection
          </p>
          <h2 className="text-2xl md:text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>{title}</h2>
        </div>
        <Link
          href={href}
          className="inline-flex items-center gap-1.5 rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          style={{ borderColor: 'var(--color-divider-strong)', color: 'var(--color-text-muted)' }}
        >
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {products.map((product) => (
          <div key={product.id} className="w-52 flex-shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  )

  if (inlined) return content
  return <section style={{ backgroundColor: 'var(--color-bg)' }}>{content}</section>
}
