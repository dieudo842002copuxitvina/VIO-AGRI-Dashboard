create extension if not exists pgcrypto;

create table if not exists user_profiles (
  user_id uuid primary key,
  role text not null default 'farmer',
  region text,
  interests text[] default '{}',
  trust_score integer not null default 50,
  verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table user_profiles add column if not exists trust_score integer not null default 50;
alter table user_profiles add column if not exists verified boolean not null default false;

create table if not exists user_verification (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  business_name text not null,
  documents jsonb not null default '[]'::jsonb,
  verified_status text not null default 'pending',
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_verification_user on user_verification(user_id);
create index if not exists idx_user_verification_status on user_verification(verified_status);

create table if not exists b2b_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid,
  user_id uuid,
  title text not null,
  commodity text,
  commodity_id uuid,
  quantity numeric not null,
  price_per_unit numeric not null,
  region text,
  location text,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table b2b_listings add column if not exists seller_id uuid;
alter table b2b_listings add column if not exists commodity text;
alter table b2b_listings add column if not exists region text;

create index if not exists idx_b2b_listings_status on b2b_listings(status);
create index if not exists idx_b2b_listings_commodity on b2b_listings(commodity);
create index if not exists idx_b2b_listings_region on b2b_listings(region);
create index if not exists idx_b2b_listings_seller on b2b_listings(seller_id);
create index if not exists idx_b2b_listings_user on b2b_listings(user_id);

create table if not exists negotiations (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null,
  buyer_id uuid not null,
  seller_id uuid not null,
  offered_price numeric not null,
  status text not null default 'pending',
  note text,
  commodity text,
  region text,
  listing_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_negotiations_listing on negotiations(listing_id);
create index if not exists idx_negotiations_buyer on negotiations(buyer_id);
create index if not exists idx_negotiations_seller on negotiations(seller_id);
create index if not exists idx_negotiations_status on negotiations(status);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  negotiation_id uuid not null,
  listing_id uuid not null,
  buyer_id uuid not null,
  seller_id uuid not null,
  amount numeric not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_transactions_negotiation on transactions(negotiation_id);
create index if not exists idx_transactions_buyer on transactions(buyer_id);
create index if not exists idx_transactions_seller on transactions(seller_id);
create index if not exists idx_transactions_status on transactions(status);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null,
  delivery_status text not null default 'awaiting_dispatch',
  logistics_info text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_orders_transaction on orders(transaction_id);
create index if not exists idx_orders_delivery_status on orders(delivery_status);

create table if not exists platform_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  user_id uuid,
  entity_type text,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_platform_events_name on platform_events(event_name);
create index if not exists idx_platform_events_user on platform_events(user_id);
create index if not exists idx_platform_events_created_at on platform_events(created_at desc);
