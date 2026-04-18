-- ============================================================
-- PawNova Schema V3 — Google OAuth (wishlist, addresses)
-- Run this in Supabase SQL Editor AFTER schema_v2.sql
-- ============================================================

-- ─── Wishlists ────────────────────────────────────────────────
create table if not exists pawnova_wishlists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references pawnova_products(id) on delete cascade,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

-- ─── Addresses ────────────────────────────────────────────────
create table if not exists pawnova_addresses (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  label       text,
  full_name   text not null,
  line1       text not null,
  line2       text,
  city        text not null,
  state       text,
  postal_code text not null,
  country     text not null default 'US',
  is_default  boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Add user_id to orders ────────────────────────────────────
alter table pawnova_orders
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists idx_pawnova_orders_user_id on pawnova_orders(user_id);

-- ─── Triggers ────────────────────────────────────────────────
create trigger pawnova_addresses_updated_at
  before update on pawnova_addresses
  for each row execute function pawnova_update_updated_at();

-- ─── Indexes ─────────────────────────────────────────────────
create index if not exists idx_pawnova_wishlists_user_id on pawnova_wishlists(user_id);
create index if not exists idx_pawnova_addresses_user_id on pawnova_addresses(user_id);

-- ─── RLS ─────────────────────────────────────────────────────
alter table pawnova_wishlists enable row level security;
alter table pawnova_addresses enable row level security;

create policy "pawnova: Users can manage their own wishlist"
  on pawnova_wishlists for all using (auth.uid() = user_id);

create policy "pawnova: Users can manage their own addresses"
  on pawnova_addresses for all using (auth.uid() = user_id);

create policy "pawnova: Users can read their own orders"
  on pawnova_orders for select using (
    auth.uid() = user_id or auth.uid() is null
  );
