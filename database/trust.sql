
-- Extension for UUID generation
create extension if not exists "uuid-ossp";

-- Add factors to user_profiles table
alter table user_profiles add column if not exists factors jsonb not null default '{}'::jsonb;

-- Table for logging trust score changes
create table if not exists user_trust_logs (
  log_id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references user_profiles(user_id),
  event text not null,
  change integer not null,
  new_score integer not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_trust_logs_user_id on user_trust_logs(user_id);
