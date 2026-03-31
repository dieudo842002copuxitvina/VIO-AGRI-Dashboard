-- Supabase Auth Profile Auto-Creation & RLS Setup
-- Run this in Supabase SQL Editor

-- Enable RLS on auth.users (if not already)
alter table auth.users enable row level security;

-- Enable RLS on user_profiles
alter table public.user_profiles enable row level security;

-- Function to handle new user profile creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (user_id, role)
  values (new.id, 'farmer')
  on conflict (user_id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: auto-create profile after auth.users insert
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS Policies for user_profiles
-- Users can view own profile
create policy "Users can view own profile" on user_profiles
  for select using (auth.uid() = user_id);

-- Users can update own profile
create policy "Users can update own profile" on user_profiles
  for update using (auth.uid() = user_id);

-- Remove overly permissive public policy

-- Admin can view all profiles
create policy "Admins view all profiles" on user_profiles
  for all using (
    exists (
      select 1 from user_profiles up 
      where up.user_id = auth.uid() and up.role = 'admin'
    )
  );

-- Role constraint (optional enum check)
alter table user_profiles 
add constraint valid_role check (role in ('farmer', 'trader', 'exporter', 'admin'));

-- Index for performance
create index if not exists idx_user_profiles_role on user_profiles(role);
create index if not exists idx_user_profiles_user_id on user_profiles(user_id);

-- Verify trigger setup
comment on trigger on_auth_user_created on auth.users is 'Auto-creates user_profiles entry after new auth.users insert';
