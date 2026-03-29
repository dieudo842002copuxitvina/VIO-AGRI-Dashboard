create extension if not exists pgcrypto;

create table if not exists experiment_assignments (
  id uuid primary key default gen_random_uuid(),
  experiment_id text not null,
  user_id text not null,
  variant text not null,
  label text not null,
  assigned_at timestamptz not null default now(),
  hash_bucket integer not null,
  finalized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists experiment_assignments_experiment_user_idx
  on experiment_assignments (experiment_id, user_id);

create index if not exists experiment_assignments_experiment_variant_idx
  on experiment_assignments (experiment_id, variant);

create table if not exists experiment_events (
  id uuid primary key default gen_random_uuid(),
  experiment_id text not null,
  user_id text not null,
  variant text not null,
  event text not null,
  event_timestamp timestamptz not null default now(),
  revenue_amount numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists experiment_events_experiment_variant_idx
  on experiment_events (experiment_id, variant);

create index if not exists experiment_events_experiment_event_idx
  on experiment_events (experiment_id, event);

create index if not exists experiment_events_user_idx
  on experiment_events (user_id);
