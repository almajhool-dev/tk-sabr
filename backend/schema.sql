-- Apply to a dedicated TK_SABR Supabase Postgres project, not unrelated databases.
begin;
create table if not exists public.tksabr_admins(uid uuid primary key references auth.users(id) on delete cascade);
alter table public.tksabr_admins enable row level security;
revoke all on public.tksabr_admins from anon,authenticated;
grant select on public.tksabr_admins to authenticated;
create policy own_admin_role on public.tksabr_admins for select to authenticated using ((select auth.uid())=uid);
create table if not exists public.tksabr_site_settings(id integer primary key check(id=1),enabled boolean not null default true,maintenance boolean not null default false,scan_limit_per_minute integer not null default 20 check(scan_limit_per_minute between 1 and 120),notice text not null default '');
insert into public.tksabr_site_settings(id) values(1) on conflict do nothing;
alter table public.tksabr_site_settings enable row level security;
revoke all on public.tksabr_site_settings from anon,authenticated;
grant select on public.tksabr_site_settings to anon,authenticated;
create policy public_settings on public.tksabr_site_settings for select to anon,authenticated using(true);
create table if not exists public.tksabr_reports(id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,username text not null check(length(username)<=24),result jsonb not null,created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '30 days');
create index if not exists tksabr_reports_owner on public.tksabr_reports(user_id,created_at desc);
create index if not exists tksabr_reports_expiry on public.tksabr_reports(expires_at);
alter table public.tksabr_reports enable row level security;
revoke all on public.tksabr_reports from anon,authenticated;
grant select,delete on public.tksabr_reports to authenticated;
-- Only the server may INSERT a verified cached scan; users cannot fabricate saved evidence.
create policy own_reports_read on public.tksabr_reports for select to authenticated using ((select auth.uid())=user_id and expires_at>now());
create policy own_reports_delete on public.tksabr_reports for delete to authenticated using ((select auth.uid())=user_id);
create or replace function public.tksabr_admin_counts() returns jsonb language sql security invoker set search_path='' as $$ select jsonb_build_object('users',(select count(*) from auth.users),'reports',(select count(*) from public.tksabr_reports)); $$;
revoke execute on function public.tksabr_admin_counts() from public,anon,authenticated;
grant execute on function public.tksabr_admin_counts() to service_role;
grant all on public.tksabr_admins,public.tksabr_site_settings,public.tksabr_reports to service_role;
commit;
-- Required daily retention job (enable pg_cron in dashboard first):
-- select cron.schedule('tksabr-retention','15 2 * * *', 'delete from public.tksabr_reports where expires_at < now()');
-- Assign an admin manually using a verified auth.users UUID; never derive it from user_metadata.
-- insert into public.tksabr_admins(uid) values('<verified-user-uuid>');
