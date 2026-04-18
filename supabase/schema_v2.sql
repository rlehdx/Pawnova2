-- ============================================================
-- PawNova Schema V2 — orders + admin RLS
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ─── Orders ──────────────────────────────────────────────────
create table if not exists pawnova_orders (
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
create table if not exists pawnova_order_lines (
  id          uuid primary key default uuid_generate_v4(),
  order_id    uuid references pawnova_orders(id) on delete cascade,
  product_id  uuid references pawnova_products(id) on delete set null,
  variant_id  uuid references pawnova_product_variants(id) on delete set null,
  title       text not null,
  variant_title text,
  quantity    integer not null,
  price       numeric(10,2) not null,
  image_url   text,
  created_at  timestamptz default now()
);

-- ─── Triggers ────────────────────────────────────────────────
create trigger pawnova_orders_updated_at
  before update on pawnova_orders
  for each row execute function pawnova_update_updated_at();

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists idx_pawnova_orders_status on pawnova_orders(status);
create index if not exists idx_pawnova_orders_created_at on pawnova_orders(created_at desc);
create index if not exists idx_pawnova_orders_customer_email on pawnova_orders(customer_email);
create index if not exists idx_pawnova_order_lines_order_id on pawnova_order_lines(order_id);

-- ─── RLS ─────────────────────────────────────────────────────
alter table pawnova_orders enable row level security;
alter table pawnova_order_lines enable row level security;
