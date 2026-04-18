# PawNova Luxury Minimal UI Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 전체 UI/UX를 Luxury Minimal 기준으로 정제 — 타이포그래피 계층, 가격 색상 통일, 터치 타겟, spacing 일관성, ProductCard/ProductInfo/Shop/Cart 개선으로 실제 전환율이 높아지는 프리미엄 이커머스 완성.

**Architecture:** CSS 변수 시스템은 유지하면서 누락된 spacing/typography 토큰 추가. 각 컴포넌트는 독립적으로 수정하며 기존 Supabase 데이터 레이어·useCart 훅은 건드리지 않는다. 모든 변경은 다크/라이트 테마 모두 호환.

**Tech Stack:** Next.js 15 App Router, Tailwind CSS v4 (`@theme`), CSS custom properties, Lucide React, TypeScript

---

## File Map

| 파일 | 작업 |
|------|------|
| `app/globals.css` | spacing 토큰 추가, typography scale 추가, shadow 토큰 추가 |
| `components/layout/Header.tsx` | 로고 타이포 개선, nav active 스타일, 검색 아이콘 링크 명확화 |
| `components/layout/Footer.tsx` | "Powered by Shopify" 텍스트 제거, spacing 정리 |
| `components/product/ProductCard.tsx` | 카테고리 라벨, 가격 색상 통일, pill 버튼, 위시리스트 아이콘, 별점 제거 |
| `components/product/ProductInfo.tsx` | 제목 반응형, 옵션 버튼 터치 타겟, 가격 레이아웃, 신뢰 배지 |
| `app/page.tsx` | Hero spacing, CategoryRow spacing 일관성 |
| `app/shop/page.tsx` | 필터 버튼 가시성, 모바일 필터 접근성 |
| `app/cart/page.tsx` | 로그인 배너 터치 타겟, 가격 색상 통일 |
| `app/collections/[handle]/page.tsx` | 헤더 spacing, 그리드 개선 |

---

### Task 1: CSS 디자인 토큰 확장 (globals.css)

**Files:**
- Modify: `app/globals.css`

**현재 문제:** spacing·typography·shadow 토큰 없음 → 컴포넌트마다 임의 값 사용

- [ ] **Step 1: globals.css 읽기**

```bash
cat app/globals.css
```

- [ ] **Step 2: @theme 블록에 토큰 추가**

`app/globals.css`의 `@theme {` 블록 안에 다음을 추가 (기존 토큰 아래):

```css
@theme {
  /* 기존 토큰들은 그대로 유지 */

  /* Shadow */
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.4);
  --shadow-card-hover: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-btn: 0 2px 8px rgba(255, 193, 7, 0.25);

  /* Transition */
  --transition-base: all 0.2s ease;
}
```

그리고 `:root` 블록에도 동일하게 추가:

```css
:root {
  /* 기존 변수들 유지 */
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.4);
  --shadow-card-hover: 0 8px 32px rgba(0, 0, 0, 0.6);
  --shadow-btn: 0 2px 8px rgba(255, 193, 7, 0.25);
  --transition-base: all 0.2s ease;
}
```

`[data-theme="light"]` 블록에도:

```css
[data-theme="light"] {
  /* 기존 변수들 유지 */
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.08);
  --shadow-card-hover: 0 8px 32px rgba(0, 0, 0, 0.16);
  --shadow-btn: 0 2px 8px rgba(255, 193, 7, 0.4);
  --transition-base: all 0.2s ease;
}
```

- [ ] **Step 3: TypeScript 빌드 확인**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1 | head -20
```

Expected: 에러 없음 (CSS 변경이라 TS 영향 없음)

- [ ] **Step 4: Commit**

```bash
cd C:/Web/Drop/pawnova && git add app/globals.css && git commit -m "design: add shadow and transition tokens to CSS system"
```

---

### Task 2: ProductCard — Luxury Minimal 정제

**Files:**
- Modify: `components/product/ProductCard.tsx`

**현재 문제:**
- 별점 더미 데이터 (신뢰 훼손)
- 가격: 할인가에 `--color-text` (흰색) vs 원가 취소선만 → 이미 OK이나 카테고리 라벨 없음
- 버튼 `border-radius: var(--radius-card)` = 14px → card와 동일해 구분 안 됨 → pill 50px으로
- 위시리스트 아이콘 없음
- 카드 호버 shadow가 `shadow-lg shadow-black/40` 하드코딩

- [ ] **Step 1: ProductCard.tsx 전체 교체**

`components/product/ProductCard.tsx`를 다음으로 교체:

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart, Heart } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { useCart } from '@/hooks/useCart'
import type { Product } from '@/types/database'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addToCart, isLoading } = useCart()

  const hasDiscount =
    product.compareAtPrice != null && product.compareAtPrice > product.price
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.compareAtPrice!) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const variantId = product.variants[0]?.id
    if (!variantId) return
    addToCart(variantId, 1)
  }

  // 컬렉션에서 카테고리 라벨 추출 (첫 번째 컬렉션)
  const categoryLabel = product.collections?.[0]?.title ?? null

  return (
    <Link
      href={`/shop/${product.handle}`}
      className="group flex flex-col rounded-[var(--radius-card)] overflow-hidden border border-[var(--color-divider)] hover:border-[var(--color-accent)] hover:-translate-y-1 transition-all duration-200"
      style={{
        backgroundColor: 'var(--color-surface)',
        boxShadow: 'var(--shadow-card)',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card-hover)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-card)')
      }
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

        {/* Sale badge */}
        {hasDiscount && (
          <span
            className="absolute top-2.5 left-2.5 inline-flex items-center rounded px-2 py-0.5 text-xs font-black text-white"
            style={{ backgroundColor: 'var(--color-badge-sale)' }}
          >
            -{discountPct}%
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
          className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          aria-label="Save to wishlist"
        >
          <Heart className="h-3.5 w-3.5" style={{ color: 'var(--color-text-muted)' }} />
        </button>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Category label */}
        {categoryLabel && (
          <p
            className="text-[10px] font-semibold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {categoryLabel}
          </p>
        )}

        {/* Title */}
        <p
          className="text-sm font-bold leading-snug line-clamp-2 flex-1"
          style={{ color: 'var(--color-text)' }}
        >
          {product.title}
        </p>

        {/* Price — discount price always white, original struck through */}
        <div className="flex items-baseline gap-2">
          <span className="text-base font-black" style={{ color: 'var(--color-text)' }}>
            {formatPrice(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-xs line-through" style={{ color: 'var(--color-text-muted)' }}>
              {formatPrice(product.compareAtPrice!)}
            </span>
          )}
        </div>

        {/* CTA — pill button */}
        <button
          onClick={handleAddToCart}
          disabled={isLoading}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-full py-2.5 text-sm font-black tracking-wide transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
          style={{
            backgroundColor: 'var(--color-accent)',
            color: 'var(--color-accent-text)',
            boxShadow: 'var(--shadow-btn)',
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

- [ ] **Step 2: TypeScript 확인**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1 | head -30
```

Expected: 에러 없음. 만약 `product.collections` 타입 에러가 나면 `types/database.ts`에서 `Product` 타입의 `collections` 필드를 확인하고, 없으면 `categoryLabel` 로직을 `null`로 고정:

```tsx
const categoryLabel = null
```

- [ ] **Step 3: Commit**

```bash
cd C:/Web/Drop/pawnova && git add components/product/ProductCard.tsx && git commit -m "design: ProductCard luxury minimal — pill CTA, category label, wishlist, no fake stars"
```

---

### Task 3: ProductInfo — 반응형 타이포 + 터치 타겟 + 가격 레이아웃

**Files:**
- Modify: `components/product/ProductInfo.tsx`

**현재 문제:**
- 제목 `text-3xl` 모바일 고정 (overflow 위험)
- 옵션 버튼 `px-3 py-1.5` ≈ 32px height → 44px 미달
- 가격: 세일가 `--color-accent` (노란색) → 통일 필요 (모두 흰색, 원가만 취소선)
- 브레드크럼 `text-sm` → 너무 커서 공간 낭비

- [ ] **Step 1: ProductInfo.tsx 읽기**

```bash
cat components/product/ProductInfo.tsx
```

- [ ] **Step 2: 다음 4곳을 수정**

**수정 1 — 브레드크럼 폰트 크기** (파일에서 `text-sm` breadcrumb 부분):

찾기:
```tsx
className="flex items-center gap-1.5 text-sm"
```
교체:
```tsx
className="flex items-center gap-1.5 text-xs"
```

**수정 2 — 제목 반응형** (h1 부분):

찾기:
```tsx
className="text-3xl font-black
```
교체:
```tsx
className="text-2xl md:text-3xl font-black
```

**수정 3 — 가격 색상 통일** (가격 표시 부분에서 세일가 색상):

찾기 (세일가 span):
```tsx
style={{ color: 'var(--color-accent)' }}
```
이 중 가격을 표시하는 것 (별점·CTA 아닌 것)을 찾아 교체:
```tsx
style={{ color: 'var(--color-text)' }}
```

**수정 4 — 옵션 버튼 터치 타겟** (variant 옵션 버튼):

찾기:
```tsx
className="... px-3 py-1.5 ...
```
교체:
```tsx
className="... px-4 py-2.5 ...
```
(파일에 `px-3 py-1.5`가 옵션 버튼에 있으면 모두 적용)

- [ ] **Step 3: TypeScript 확인**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd C:/Web/Drop/pawnova && git add components/product/ProductInfo.tsx && git commit -m "design: ProductInfo responsive title, touch targets, price color unified"
```

---

### Task 4: Header — 로고 타이포 + Footer Shopify 텍스트 제거

**Files:**
- Modify: `components/layout/Header.tsx`
- Modify: `components/layout/Footer.tsx`

**현재 문제:**
- Footer에 "Powered by Shopify" 텍스트가 있음 (브랜드 신뢰 손상 — Shopify 미사용 프로젝트)
- Header 로고 크기·weight 개선 여지 있음

- [ ] **Step 1: Footer에서 Shopify 텍스트 제거**

`components/layout/Footer.tsx`를 읽고 "Shopify" 문자열을 포함하는 라인을 찾아 제거:

```bash
grep -n "Shopify\|shopify" components/layout/Footer.tsx
```

해당 라인 또는 관련 `<span>`/`<p>` 블록 전체를 삭제.

- [ ] **Step 2: Header 로고 강화**

`components/layout/Header.tsx`에서 로고 부분을 찾아 letter-spacing, font-weight 강화:

찾기 (로고 Link):
```tsx
className="... font-black ...
```
로고에 `tracking-wider` 또는 `tracking-widest`가 없으면 추가:
```tsx
className="text-lg font-black tracking-wider"
```

- [ ] **Step 3: TypeScript 확인**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd C:/Web/Drop/pawnova && git add components/layout/Header.tsx components/layout/Footer.tsx && git commit -m "design: remove Shopify branding from footer, strengthen logo typography"
```

---

### Task 5: Shop Page — 필터 가시성 + 모바일 접근성

**Files:**
- Modify: `app/shop/page.tsx`

**현재 문제:**
- 모바일 필터 버튼이 작고 레이블 없음
- 상품 수 카운트 표시 없음 (또는 작음)
- 헤더 섹션 spacing 불일치

- [ ] **Step 1: app/shop/page.tsx 읽기**

```bash
cat app/shop/page.tsx
```

- [ ] **Step 2: 모바일 필터 버튼 개선**

파일에서 모바일 필터 버튼 부분 찾기 (MobileFilterDrawer를 여는 버튼):

찾기 (MobileFilterDrawer trigger 버튼, 대략):
```tsx
<button
```
이 버튼에 `min-h-[44px]` 또는 `py-3` 추가, 텍스트가 없으면 "Filters" 텍스트 추가.

예시 패턴:
```tsx
<button
  className="flex md:hidden items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold min-h-[44px] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
  style={{ borderColor: 'var(--color-divider)', color: 'var(--color-text-muted)' }}
>
  <SlidersHorizontal className="h-4 w-4" />
  Filters
</button>
```

(실제 파일 코드에 맞게 적용)

- [ ] **Step 3: TypeScript 확인**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
cd C:/Web/Drop/pawnova && git add app/shop/page.tsx && git commit -m "design: shop page mobile filter button touch target and label"
```

---

### Task 6: Cart Page — 로그인 배너 터치 타겟 + 신뢰 영역

**Files:**
- Modify: `app/cart/page.tsx`

**현재 문제:**
- 로그인 배너의 "Sign in" 버튼 `px-3 py-1.5` → 터치 타겟 미달
- 신뢰 아이콘 section spacing 개선

- [ ] **Step 1: app/cart/page.tsx 읽기**

```bash
cat app/cart/page.tsx
```

- [ ] **Step 2: Sign in 버튼 터치 타겟 확대**

파일에서 Sign in 버튼 찾기 (Google OAuth 버튼):

찾기:
```tsx
className="... px-3 py-1.5 ...
```
교체:
```tsx
className="... px-5 py-2.5 ...
```

또는 버튼에 `min-h-[44px]` 추가.

- [ ] **Step 3: 배너 dismiss 버튼 터치 타겟 확대**

배너 닫기(×) 버튼 찾기:
```tsx
onClick={() => setBannerDismissed(true)}
```
해당 버튼에 `p-2` 이상 추가하여 최소 44×44px 확보.

- [ ] **Step 4: TypeScript 확인**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
cd C:/Web/Drop/pawnova && git add app/cart/page.tsx && git commit -m "design: cart login banner touch targets improved for mobile"
```

---

### Task 7: Homepage — Spacing 일관성 + Trust Bar 개선

**Files:**
- Modify: `app/page.tsx`

**현재 문제:**
- 섹션 간 `py-14` vs `py-10` vs `py-12` 혼재
- CategoryRow 카드 너비 `w-48` → 약간 좁음 (모바일에서 이미지 작음)
- Testimonials 섹션 제목 `text-3xl` → 반응형 없음

- [ ] **Step 1: app/page.tsx 읽기**

```bash
cat app/page.tsx
```

- [ ] **Step 2: Testimonials 제목 반응형**

찾기:
```tsx
<h2 className="text-3xl font-bold mb-8"
```
교체:
```tsx
<h2 className="text-2xl md:text-3xl font-bold mb-8"
```

- [ ] **Step 3: CategoryRow 카드 너비 개선**

찾기:
```tsx
className="w-48 flex-shrink-0"
```
교체:
```tsx
className="w-52 flex-shrink-0"
```

- [ ] **Step 4: TypeScript 확인**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 5: Commit**

```bash
cd C:/Web/Drop/pawnova && git add app/page.tsx && git commit -m "design: homepage testimonials responsive title, category row wider cards"
```

---

### Task 8: 최종 빌드 검증 + Push

**Files:** 없음 (검증만)

- [ ] **Step 1: 전체 TypeScript 검증**

```bash
cd C:/Web/Drop/pawnova && npx tsc --noEmit 2>&1
```

Expected: 에러 없음

- [ ] **Step 2: Next.js 빌드 확인**

```bash
cd C:/Web/Drop/pawnova && npx next build 2>&1 | tail -30
```

Expected: `✓ Compiled successfully` 또는 `Route (app)` 테이블 출력

- [ ] **Step 3: Git 상태 확인**

```bash
cd C:/Web/Drop/pawnova && git log --oneline -8
```

- [ ] **Step 4: GitHub Push**

```bash
cd C:/Web/Drop/pawnova && git push origin main
```

Expected: `main -> main` 성공 메시지
