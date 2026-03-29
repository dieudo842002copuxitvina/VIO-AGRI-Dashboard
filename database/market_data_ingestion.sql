create extension if not exists pgcrypto;

create table if not exists market_data (
  id uuid primary key default gen_random_uuid(),
  commodity_id text not null,
  commodity_name text not null,
  region text not null default 'Global',
  current_price numeric(18,4) not null,
  price_unit text not null,
  price_change_24h numeric(18,4),
  price_change_percentage_24h numeric(12,4),
  demand_level text check (demand_level in ('low', 'medium', 'high')),
  supply_level text check (supply_level in ('low', 'medium', 'high')),
  volatility_index numeric(6,2),
  trend_direction text check (trend_direction in ('uptrend', 'downtrend', 'sideways')),
  seasonality_score numeric(8,2),
  timestamp timestamptz not null default now(),
  observed_at timestamptz not null default now(),
  ingested_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  provider text not null default 'manual',
  provider_series_id text,
  market_scope text not null default 'global',
  currency_code text not null default 'USD',
  data_source text,
  source text,
  source_frequency text not null default 'daily',
  is_verified boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb
);

alter table market_data add column if not exists observed_at timestamptz not null default now();
alter table market_data add column if not exists ingested_at timestamptz not null default now();
alter table market_data add column if not exists provider text not null default 'manual';
alter table market_data add column if not exists provider_series_id text;
alter table market_data add column if not exists market_scope text not null default 'global';
alter table market_data add column if not exists currency_code text not null default 'USD';
alter table market_data add column if not exists source_frequency text not null default 'daily';
alter table market_data add column if not exists raw_payload jsonb not null default '{}'::jsonb;
alter table market_data add column if not exists data_source text;
alter table market_data add column if not exists source text;

create unique index if not exists idx_market_data_series_observed_unique
  on market_data(provider, provider_series_id, region, observed_at);
create index if not exists idx_market_data_commodity_timestamp on market_data(commodity_id, observed_at desc);
create index if not exists idx_market_data_provider_timestamp on market_data(provider, observed_at desc);
create index if not exists idx_market_data_market_scope on market_data(market_scope);
create index if not exists idx_market_data_region on market_data(region);
create index if not exists idx_market_data_ingested_at on market_data(ingested_at desc);
create index if not exists idx_market_data_metadata on market_data using gin(metadata);

create table if not exists market_data_ingestion_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null default 'manual',
  status text not null default 'running',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_fetched integer not null default 0,
  records_stored integer not null default 0,
  source_results jsonb not null default '[]'::jsonb,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_market_data_ingestion_runs_started_at
  on market_data_ingestion_runs(started_at desc);
create index if not exists idx_market_data_ingestion_runs_status
  on market_data_ingestion_runs(status);
