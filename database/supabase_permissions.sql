-- Run this in the Supabase SQL Editor to align grants for marketplace tables.
-- Service-role grants are required for secure server-side jobs and admin routes.
-- Anon/authenticated grants work together with RLS policies defined in database/supabase_marketplace_rls.sql.

grant usage on schema public to anon, authenticated, service_role;

grant select on table public.market_insights to anon, authenticated;
grant select on table public.listings to anon, authenticated;

grant select, insert, update on table public.user_profiles to authenticated;
grant select, insert, update, delete on table public.listings to authenticated;
grant select, insert, update on table public.deals to authenticated;

grant all privileges on table public.market_insights to service_role;
grant all privileges on table public.listings to service_role;
grant all privileges on table public.user_profiles to service_role;
grant all privileges on table public.deals to service_role;

grant usage, select on all sequences in schema public to authenticated, service_role;

alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to service_role;
