# PawNova — Premium Pet Wellness Storefront

프로덕션급 Next.js 15 이커머스 스토어. Supabase를 백엔드 데이터베이스로 사용하는 완전 자체 제작 방식.

---

## Tech Stack

- **Next.js 15** (App Router, TypeScript strict)
- **Supabase** (PostgreSQL DB, Storage, RLS)
- **Tailwind CSS v4**
- **Framer Motion**
- **Zustand** (cart + UI state)
- **SWR** (client-side fetching)
- **Vercel** (deployment)

---

## Supabase 셋업 (필수)

### Step 1 — Supabase 프로젝트 생성
[supabase.com](https://supabase.com) → New Project 생성

### Step 2 — 데이터베이스 스키마 적용
Supabase Dashboard → SQL Editor → `supabase/schema.sql` 전체 내용 붙여넣고 실행

### Step 3 — 환경변수 설정
`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SITE_URL=https://pawnova.com
```

키 위치: Supabase Dashboard → Settings → API

### Step 4 — 이미지 스토리지 설정 (선택)
Supabase Storage → New Bucket → `product-images` (Public)

### Step 5 — 로컬 개발 시작
```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## 데이터베이스 구조

```
collections          컬렉션 (dogs, cats, featured, sale, new-arrivals)
products             상품 기본 정보
product_images       상품 이미지 (정렬 가능)
product_variants     상품 옵션/재고/가격
product_collections  상품 ↔ 컬렉션 연결 (다대다)
carts                장바구니 (session_id 기반)
cart_lines           장바구니 아이템
newsletter_subscribers 뉴스레터 구독자
```

---

## 상품 등록 방법

### Supabase Dashboard에서 직접 입력

```sql
-- 상품 등록
INSERT INTO products (handle, title, description, description_html, tags)
VALUES (
  'premium-cat-toy',
  'Premium Interactive Cat Toy',
  'Keeps your cat entertained for hours.',
  '<p>Keeps your cat entertained for hours.</p>',
  ARRAY['cats', 'toys', 'interactive']
);

-- 상품 이미지 등록
INSERT INTO product_images (product_id, url, alt_text, sort_order)
VALUES (
  (SELECT id FROM products WHERE handle = 'premium-cat-toy'),
  'https://your-project.supabase.co/storage/v1/object/public/product-images/cat-toy.jpg',
  'Premium cat toy',
  0
);

-- 상품 가격/재고 등록 (기본 옵션)
INSERT INTO product_variants (product_id, title, price, inventory_quantity)
VALUES (
  (SELECT id FROM products WHERE handle = 'premium-cat-toy'),
  'Default',
  29.99,
  100
);

-- 컬렉션에 추가
INSERT INTO product_collections (product_id, collection_id)
VALUES (
  (SELECT id FROM products WHERE handle = 'premium-cat-toy'),
  (SELECT id FROM collections WHERE handle = 'cats')
);
```

### 여러 옵션이 있는 상품 (사이즈별)

```sql
-- 사이즈 옵션이 있는 경우
INSERT INTO product_variants (product_id, title, price, inventory_quantity, option1_name, option1_value)
VALUES
  ((SELECT id FROM products WHERE handle = 'dog-collar'), 'Small', 19.99, 50, 'Size', 'S'),
  ((SELECT id FROM products WHERE handle = 'dog-collar'), 'Medium', 22.99, 50, 'Size', 'M'),
  ((SELECT id FROM products WHERE handle = 'dog-collar'), 'Large', 25.99, 30, 'Size', 'L');
```

---

## 결제 연동 (Stripe 권장)

현재 `/checkout` 페이지는 플레이스홀더입니다. Stripe 연동 방법:

```bash
npm install @stripe/stripe-js stripe
```

`.env.local`에 추가:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

`app/api/checkout/route.ts`에 Stripe Checkout Session 생성 로직 구현 후
`/api/webhooks/orders`에서 `payment_intent.succeeded` 이벤트 처리.

---

## 배포 (Vercel)

```bash
npm i -g vercel
vercel --prod
```

Vercel 대시보드 → Environment Variables에 4개 환경변수 추가:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

---

## 프로젝트 구조

```
pawnova/
├── app/                    Next.js App Router
│   ├── page.tsx            홈페이지
│   ├── shop/               상품 목록 + 상세
│   ├── collections/        컬렉션 페이지
│   ├── cart/               장바구니 (모바일)
│   └── api/                API 라우트
├── components/             React 컴포넌트
├── lib/supabase/           Supabase 데이터 레이어
│   ├── client.ts           클라이언트 생성
│   ├── products.ts         상품 쿼리
│   ├── collections.ts      컬렉션 쿼리
│   └── cart.ts             장바구니 CRUD
├── supabase/
│   └── schema.sql          DB 스키마 (SQL Editor에서 실행)
├── store/                  Zustand 상태
├── hooks/                  커스텀 훅
└── types/
    └── database.ts         TypeScript 타입 정의
```

---

## 장바구니 동작 방식

1. 사용자가 "Add to Cart" 클릭
2. `POST /api/cart/add` → `pawnova_session` 쿠키 생성/조회
3. Supabase `carts` 테이블에 session 기반 카트 생성
4. `cart_lines`에 상품 추가 (같은 variant면 수량 증가)
5. 카트 드로어 오픈, 실시간 합계 계산
6. "Checkout" → `/checkout` (Stripe 연동 필요)

© 2026 PawNova
