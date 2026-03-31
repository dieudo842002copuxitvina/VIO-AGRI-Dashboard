
-- Extension for UUID generation
create extension if not exists "uuid-ossp";

-- Table for logging escrow events
create table if not exists escrow_logs (
  log_id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references transactions(id),
  event text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_escrow_logs_transaction_id on escrow_logs(transaction_id);

-- Add platform_fee to transactions table
alter table transactions add column if not exists platform_fee numeric;
