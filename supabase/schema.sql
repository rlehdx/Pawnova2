-- ============================================================
-- PawNova Database Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Collections ─────────────────────────────────────────────
create table if not exists pawnova_collections (
  id          uuid primary key default uuid_generate_v4(),
  handle      text unique not null,
  title       text not null,
  description text,
  image_url   text,
  image_alt   text,
  seo_title   text,
  seo_description text,
  sort_order  integer default 0,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ─── Products ─────────────────────────────────────────────────
create table if not exists pawnova_products (
  id              uuid primary key default uuid_generate_v4(),
  handle          text unique not null,
  title           text not null,
  description     text,
  description_html text,
  tags            text[] default '{}',
  is_active       boolean default true,
  seo_title       text,
  seo_description text,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ─── Product ↔ Collection (many-to-many) ─────────────────────
create table if not exists pawnova_product_collections (
  product_id    uuid references pawnova_products(id) on delete cascade,
  collection_id uuid references pawnova_collections(id) on delete cascade,
  sort_order    integer default 0,
  primary key (product_id, collection_id)
);

-- ─── Product Images ───────────────────────────────────────────
create table if not exists pawnova_product_images (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid references pawnova_products(id) on delete cascade,
  url         text not null,
  alt_text    text,
  width       integer,
  height      integer,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);

-- ─── Product Variants ─────────────────────────────────────────
create table if not exists pawnova_product_variants (
  id                  uuid primary key default uuid_generate_v4(),
  product_id          uuid references pawnova_products(id) on delete cascade,
  title               text not null default 'Default',
  price               numeric(10,2) not null,
  compare_at_price    numeric(10,2),
  sku                 text,
  inventory_quantity  integer default 0,
  available_for_sale  boolean default true,
  option1_name        text,
  option1_value       text,
  option2_name        text,
  option2_value       text,
  image_url           text,
  image_alt           text,
  sort_order          integer default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ─── Carts ────────────────────────────────────────────────────
create table if not exists pawnova_carts (
  id         uuid primary key default uuid_generate_v4(),
  session_id text unique not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── Cart Lines ───────────────────────────────────────────────
create table if not exists pawnova_cart_lines (
  id          uuid primary key default uuid_generate_v4(),
  cart_id     uuid references pawnova_carts(id) on delete cascade,
  variant_id  uuid references pawnova_product_variants(id) on delete cascade,
  quantity    integer not null check (quantity > 0),
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique (cart_id, variant_id)
);

-- ─── Newsletter Subscribers ───────────────────────────────────
create table if not exists pawnova_newsletter_subscribers (
  id         uuid primary key default uuid_generate_v4(),
  email      text unique not null,
  created_at timestamptz default now()
);

-- ─── Updated_at triggers ──────────────────────────────────────
create or replace function pawnova_update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger pawnova_products_updated_at
  before update on pawnova_products
  for each row execute function pawnova_update_updated_at();

create trigger pawnova_product_variants_updated_at
  before update on pawnova_product_variants
  for each row execute function pawnova_update_updated_at();

create trigger pawnova_collections_updated_at
  before update on pawnova_collections
  for each row execute function pawnova_update_updated_at();

create trigger pawnova_carts_updated_at
  before update on pawnova_carts
  for each row execute function pawnova_update_updated_at();

create trigger pawnova_cart_lines_updated_at
  before update on pawnova_cart_lines
  for each row execute function pawnova_update_updated_at();

-- ─── Indexes ──────────────────────────────────────────────────
create index if not exists idx_pawnova_products_handle on pawnova_products(handle);
create index if not exists idx_pawnova_products_is_active on pawnova_products(is_active);
create index if not exists idx_pawnova_products_created_at on pawnova_products(created_at desc);
create index if not exists idx_pawnova_collections_handle on pawnova_collections(handle);
create index if not exists idx_pawnova_product_images_product_id on pawnova_product_images(product_id, sort_order);
create index if not exists idx_pawnova_product_variants_product_id on pawnova_product_variants(product_id, sort_order);
create index if not exists idx_pawnova_cart_lines_cart_id on pawnova_cart_lines(cart_id);
create index if not exists idx_pawnova_carts_session_id on pawnova_carts(session_id);

-- ─── RLS (Row Level Security) ─────────────────────────────────
alter table pawnova_products enable row level security;
alter table pawnova_collections enable row level security;
alter table pawnova_product_images enable row level security;
alter table pawnova_product_variants enable row level security;
alter table pawnova_product_collections enable row level security;
alter table pawnova_carts enable row level security;
alter table pawnova_cart_lines enable row level security;
alter table pawnova_newsletter_subscribers enable row level security;

-- Public read access for products/collections
create policy "pawnova: Public can read active products"
  on pawnova_products for select using (is_active = true);

create policy "pawnova: Public can read active collections"
  on pawnova_collections for select using (is_active = true);

create policy "pawnova: Public can read product images"
  on pawnova_product_images for select using (true);

create policy "pawnova: Public can read product variants"
  on pawnova_product_variants for select using (true);

create policy "pawnova: Public can read product collections"
  on pawnova_product_collections for select using (true);

-- Cart: anyone can manage their own cart (session-based, enforced in API)
create policy "pawnova: Anyone can manage carts"
  on pawnova_carts for all using (true);

create policy "pawnova: Anyone can manage cart lines"
  on pawnova_cart_lines for all using (true);

-- Newsletter: insert only
create policy "pawnova: Anyone can subscribe to newsletter"
  on pawnova_newsletter_subscribers for insert with check (true);

-- ─── Sample Data ──────────────────────────────────────────────
insert into pawnova_collections (handle, title, description, sort_order) values
  ('dogs',         'Dogs',         'Premium accessories for your dog',       1),
  ('cats',         'Cats',         'Premium accessories for your cat',       2),
  ('new-arrivals', 'New Arrivals', 'Just landed in our store',               3),
  ('featured',     'Featured',     'Our most popular products',              4),
  ('sale',         'Sale',         'Great deals on pet wellness accessories', 5)
on conflict (handle) do nothing;
