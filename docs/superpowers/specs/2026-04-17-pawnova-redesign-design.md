# PawNova Full Redesign — Design Spec
Date: 2026-04-17

## Summary
Full visual rebuild of pawnova (Next.js 15, Tailwind CSS). Transition from warm-orange/serif tone to Dark Premium (#0f0f0f + #FFC107 yellow accent). All components use CSS variable tokens. English-only content.

## Decisions
| Item | Choice |
|---|---|
| Overall tone | Dark Premium — #0f0f0f base, #FFC107 accent only |
| Hero layout | Centered headline + floating pill nav + Bento grid below |
| Product Card | Always-visible "Add to Cart" CTA |
| Page section flow | Classic Ecommerce: Hero → Marquee → Deals → Category Rows → Testimonials → Newsletter |

---

## 1. Design Tokens (`app/globals.css`)

Replace all existing `@theme` and `:root` variables:

```css
/* Light theme (not used by default — dark is default) */
--color-bg: #0f0f0f;
--color-surface: #1c1c1c;
--color-surface-2: #2a2a2a;        /* card image bg, input bg */
--color-text: #f5f5f5;
--color-text-muted: #9a9a9a;
--color-accent: #FFC107;
--color-accent-hover: #FFB300;
--color-accent-text: #000000;      /* text ON yellow backgrounds */
--color-divider: #2a2a2a;
--color-badge-sale: #ef4444;
--radius-btn: 50px;                /* pill buttons */
--radius-card: 14px;               /* product cards, bento cells */
```

Dark mode `[data-theme="dark"]`: same values (dark is the primary theme).
Light mode `[data-theme="light"]`: `--color-bg: #f5f5f5`, `--color-surface: #ffffff`, `--color-surface-2: #f0f0f0`, `--color-text: #0f0f0f`, `--color-text-muted: #6b6b6b`, `--color-divider: #e5e5e5`. Accent unchanged.

Add to globals.css:
```css
/* Scroll fade-up */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-up { animation: fadeUp 0.5s ease-out forwards; opacity: 0; }

/* Marquee trust bar */
@keyframes marquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.animate-marquee { animation: marquee 30s linear infinite; }

/* Hide scrollbar (category rows) */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## 2. Header (`components/layout/Header.tsx`)

**Structure:**
- Floating pill shape: `rounded-full border border-[var(--color-divider)] bg-[var(--color-surface)]/80 backdrop-blur-md` — no hardcoded hex
- Wrapped in `mx-auto max-w-7xl px-4` container, floats above page (not full-bleed)
- Scroll: add `shadow-lg shadow-black/40` + `border-[var(--color-accent)]/30` on scroll

**Left:** PawNova logo (paw SVG + wordmark, accent color)
**Center:** Nav links — Shop All · Dogs · Cats · New Arrivals · Sale
**Right:** Search icon · Theme toggle · UserMenu · CartButton (yellow badge)

**Mobile:** Pill collapses to logo + hamburger. Drawer slides from right (not full-screen takeover).

**Fix:** Remove hardcoded `rgba(247,246,242,0.85)` — use CSS variable.

---

## 3. AnnouncementBar (`components/layout/AnnouncementBar.tsx`)

- Background: `var(--color-accent)` (#FFC107)
- Text: `var(--color-accent-text)` (#000) — fixes current white-on-yellow contrast issue
- Dismiss X button: black, not white

---

## 4. Hero Section (`app/page.tsx`)

**Layout:** Full-width centered, `py-24 md:py-32`

```
[NEW SEASON 2025] ← yellow pill badge
Premium Pet Wellness.  ← text-6xl md:text-8xl font-black text-white
Science-backed toys & gear for curious, happy pets.  ← muted subtitle
[Shop Best Sellers →]  [See What's New]  ← pill CTA + ghost
★★★★★ Loved by 40,000+ pet parents  ← social proof line

─────────────── Bento Grid ───────────────
┌─────────────────────────┬──────┐
│  ⚡ Weekly Deals         │ 🐕   │
│  Up to 40% off          │ Dogs │
│  selected items         ├──────┤
│                         │ 🐈   │
└─────────────────────────┘ Cats ┘
  2fr                       1fr
```

Bento grid: `grid-cols-3`, left cell `col-span-2`. All cells: surface bg, border, rounded-[var(--radius-card)].

---

## 5. Marquee Trust Bar (`app/page.tsx`)

- Full-bleed yellow background (`bg-[var(--color-accent)]`)
- `py-3`
- Infinite CSS marquee animation (duplicate items for seamless loop)
- 4 items with `✦` separator: `Free Shipping $50+` · `Loyalty Rewards` · `30-Day Returns` · `40,000+ Reviews`
- Text: `font-bold text-sm text-[var(--color-accent-text)]`

---

## 6. Weekly Deals Section (`app/page.tsx`)

**Header row:**
- Left: ⚡ icon in yellow circle + "Weekly Deals" title + subtitle
- Right: "View All →" link

**Grid:** `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4`

Uses `<ProductCard>` (see §8). Shows up to 10 products from `displayFeatured`.

**Scroll animation:** Section fades up via IntersectionObserver + `.animate-fade-up`.

---

## 7. Category Rows — Dogs & Cats (`app/page.tsx`)

`<CategoryRow>` component:
- Section title + "View All →"
- `flex gap-4 overflow-x-auto pb-4` horizontal scroll
- Hide scrollbar: `scrollbar-hide` (add utility in globals.css)
- Each card: `w-48 flex-shrink-0`

---

## 8. ProductCard (`components/product/ProductCard.tsx`)

**Structure (top to bottom):**
1. Image area (`aspect-square`, `bg-[var(--color-surface-2)]`)
   - Sale badge: red pill top-left `-XX%`
   - Image: `object-cover group-hover:scale-105 transition-transform duration-300`
2. Info area (`p-4 space-y-1.5`)
   - Stars: 5× yellow fill, hardcoded display only (no rating in DB) — always shows 5 stars + `(4.9)` as placeholder. Acceptable for MVP.
   - Title: `text-sm font-semibold text-[var(--color-text)] line-clamp-2`
   - Price row: bold white price + muted strikethrough compare price
3. CTA: `w-full bg-[var(--color-accent)] text-[var(--color-accent-text)] font-bold rounded-[var(--radius-card)] py-2.5 text-sm hover:bg-[var(--color-accent-hover)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-200`
   — uses `--radius-card` (14px), NOT `--radius-btn` (50px pill). Pill buttons are for hero/newsletter CTAs only.

**Card shell:**
- `bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-card)]`
- Hover: `hover:border-[var(--color-accent)] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/40`
- All transitions: `transition-all duration-200`

---

## 9. Testimonials (`app/page.tsx`)

- 3-col grid `md:grid-cols-3`
- Each card: `bg-[var(--color-surface)] border border-[var(--color-divider)] rounded-[var(--radius-card)] p-6`
- Stars: yellow
- Quote text: muted
- Name: white bold, role: muted small

---

## 10. Newsletter (`app/page.tsx`)

- Full-width `bg-[var(--color-surface)]` section
- Centered, max-w-xl
- Heading: white bold
- Input: `bg-[var(--color-surface-2)] border border-[var(--color-divider)] rounded-full focus:border-[var(--color-accent)] focus:ring-[var(--color-accent)]`
- Button: yellow pill `rounded-full`

---

## 11. Footer (`components/layout/Footer.tsx`)

- No structural changes
- Update all hardcoded colors to CSS variables
- Ensure dark theme consistency

---

## Motion Rules

| Element | Effect |
|---|---|
| All interactive | `transition-all duration-300 ease-out` |
| Buttons | `hover:scale-[1.02] active:scale-[0.98]` |
| Product cards | `hover:-translate-y-0.5` |
| Trust bar | CSS `@keyframes marquee` infinite |
| Page sections | IntersectionObserver + `.animate-fade-up` |

---

## Files to Change

| File | Change |
|---|---|
| `app/globals.css` | Token replacement + keyframes |
| `components/layout/Header.tsx` | Pill nav, fix hardcoded colors, mobile drawer |
| `components/layout/AnnouncementBar.tsx` | Black text on yellow |
| `components/product/ProductCard.tsx` | Full rewrite to dark card + always-visible CTA |
| `app/page.tsx` | Hero rewrite + Marquee + Weekly Deals + section animations |
| `components/layout/Footer.tsx` | Token update only |

## Files NOT to Change
- All API routes
- Store (cartStore, uiStore)
- Hooks
- Types
- Supabase lib
- Admin pages
- Shop/collection pages (out of scope)
