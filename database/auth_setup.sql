-- Supabase User Profile RLS Setup
-- Run this in the Supabase SQL Editor.
-- This version intentionally does not touch auth.users because some projects
-- do not permit creating or dropping triggers on managed auth tables.
-- User profiles will be auto-created by the application on first authenticated access.

alter table if exists public.user_profiles enable row level security;
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

drop policy if exists "Users can view own profile" on public.user_profiles;
drop policy if exists "Users can insert own profile" on public.user_profiles;
drop policy if exists "Users can update own profile" on public.user_profiles;
drop policy if exists "Admins manage all profiles" on public.user_profiles;
drop policy if exists "Admins view all profiles" on public.user_profiles;

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

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'valid_role'
      and conrelid = 'public.user_profiles'::regclass
  ) then
    alter table public.user_profiles
      add constraint valid_role check (role in ('farmer', 'trader', 'exporter', 'admin'));
  end if;
end;
$$;

create index if not exists idx_user_profiles_role on public.user_profiles(role);
create index if not exists idx_user_profiles_user_id on public.user_profiles(user_id);
