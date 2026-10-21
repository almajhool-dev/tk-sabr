
create table public.tksabr_settings (id integer primary key check(id=1), maintenance boolean not null default false, scanning boolean not null default true, per_minute integer not null default 10 check(per_minute between 1 and 60), notice text not null default '' check(length(notice)<=300));
insert into public.tksabr_settings(id) values(1);
create table public.tksabr_admins (uid uuid primary key references auth.users(id) on delete cascade);
create table public.tksabr_scans (id uuid primary key,username text not null,payload jsonb not null,expires_at timestamptz not null);
create index on public.tksabr_scans(username,expires_at desc);
create table public.tksabr_reports (id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id) on delete cascade,scan_id uuid not null,payload jsonb not null,created_at timestamptz not null default now());
create index on public.tksabr_reports(user_id,created_at desc);
create table public.tksabr_events (id bigint generated always as identity primary key,code text not null check(length(code)<80),created_at timestamptz not null default now());
create index on public.tksabr_events(created_at desc);
create table public.tksabr_rate_limits (key text primary key,count integer not null,reset_at timestamptz not null);
alter table public.tksabr_settings enable row level security;
alter table public.tksabr_admins enable row level security;
alter table public.tksabr_scans enable row level security;
alter table public.tksabr_reports enable row level security;
alter table public.tksabr_events enable row level security;
alter table public.tksabr_rate_limits enable row level security;
revoke all on public.tksabr_settings,public.tksabr_admins,public.tksabr_scans,public.tksabr_reports,public.tksabr_events,public.tksabr_rate_limits from anon,authenticated;
grant select,delete on public.tksabr_reports to authenticated;
create policy report_owner_read on public.tksabr_reports for select to authenticated using ((select auth.uid())=user_id);
create policy report_owner_delete on public.tksabr_reports for delete to authenticated using ((select auth.uid())=user_id);
create function public.tksabr_rate_limit(p_key text,p_limit integer,p_window integer default 60) returns boolean language plpgsql security invoker set search_path='' as $$
declare n integer; bucket text; reset timestamptz;
begin
 if p_limit<1 or p_limit>1000 or p_window<1 or p_window>3600 then raise exception 'invalid limit'; end if;
 bucket := p_key || ':' || floor(extract(epoch from now()) / p_window)::text;
 reset := to_timestamp((floor(extract(epoch from now()) / p_window)+1)*p_window);
 insert into public.tksabr_rate_limits(key,count,reset_at) values(bucket,1,reset)
 on conflict(key) do update set count=tksabr_rate_limits.count+1 returning count into n;
 return n<=p_limit;
end $$;
revoke all on function public.tksabr_rate_limit(text,integer,integer) from public,anon,authenticated;
grant execute on function public.tksabr_rate_limit(text,integer,integer) to service_role;
create function public.tksabr_cleanup() returns void language sql security invoker set search_path='' as $$
 delete from public.tksabr_scans where expires_at<now();
 delete from public.tksabr_reports where created_at<now()-interval '30 days';
 delete from public.tksabr_events where created_at<now()-interval '7 days';
 delete from public.tksabr_rate_limits where reset_at<now();
$$;
revoke all on function public.tksabr_cleanup() from public,anon,authenticated;
grant execute on function public.tksabr_cleanup() to service_role;

grant all on public.tksabr_settings,public.tksabr_admins,public.tksabr_scans,public.tksabr_reports,public.tksabr_events,public.tksabr_rate_limits to service_role;
grant usage,select on all sequences in schema public to service_role;
