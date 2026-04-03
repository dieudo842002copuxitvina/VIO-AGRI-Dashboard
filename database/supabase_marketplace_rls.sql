-- Run this after database/auth_setup.sql.
-- This file defines marketplace RLS for manually created Supabase tables.

alter table public.user_profiles add column if not exists business_name text;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

alter table if exists public.user_profiles enable row level security;
alter table if exists public.listings enable row level security;
alter table if exists public.market_insights enable row level security;
alter table if exists public.deals enable row level security;

drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Admins view all profiles" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Admins manage all profiles" on public.user_profiles;

create policy "Users can view own profile"
on public.user_profiles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert own profile"
on public.user_profiles
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own profile"
on public.user_profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Admins manage all profiles"
on public.user_profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read market insights" on public.market_insights;
drop policy if exists "Admins manage market insights" on public.market_insights;

create policy "Public can read market insights"
on public.market_insights
for select
to anon, authenticated
using (true);

create policy "Admins manage market insights"
on public.market_insights
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active listings" on public.listings;
drop policy if exists "Users can read own listings" on public.listings;
drop policy if exists "Users can create own listings" on public.listings;
drop policy if exists "Users can update own listings" on public.listings;
drop policy if exists "Users can delete own listings" on public.listings;
drop policy if exists "Admins manage all listings" on public.listings;

create policy "Public can read active listings"
on public.listings
for select
to anon, authenticated
using (status = 'active');

create policy "Users can read own listings"
on public.listings
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create own listings"
on public.listings
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update own listings"
on public.listings
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own listings"
on public.listings
for delete
to authenticated
using (auth.uid() = user_id);

create policy "Admins manage all listings"
on public.listings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Deal participants can read deals" on public.deals;
drop policy if exists "Buyers can create deals" on public.deals;
drop policy if exists "Deal participants can update deals" on public.deals;
drop policy if exists "Admins manage all deals" on public.deals;

create policy "Deal participants can read deals"
on public.deals
for select
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Buyers can create deals"
on public.deals
for insert
to authenticated
with check (auth.uid() = buyer_id);

create policy "Deal participants can update deals"
on public.deals
for update
to authenticated
using (auth.uid() = buyer_id or auth.uid() = seller_id)
with check (auth.uid() = buyer_id or auth.uid() = seller_id);

create policy "Admins manage all deals"
on public.deals
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
