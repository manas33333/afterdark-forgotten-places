-- AFTERDARK initial schema. Run with Supabase CLI: supabase db push
create extension if not exists pgcrypto;
create extension if not exists postgis;
create type public.publication_status as enum ('pending','approved','rejected','needs_info');
create type public.user_role as enum ('member','moderator','admin');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 username text unique check (username is null or length(username) between 3 and 30),
 display_name text check (display_name is null or length(display_name)<=80),
 avatar_url text,
 bio text check (bio is null or length(bio)<=500),
 role public.user_role not null default 'member',
 suspended boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.locations (
 id uuid primary key default gen_random_uuid(),
 name text not null check(length(name) between 3 and 160), category text not null,
 description text not null check(length(description) between 10 and 5000), city text not null,
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 geog geography(point,4326) generated always as (st_setsrid(st_makepoint(longitude,latitude),4326)::geography) stored,
 status public.publication_status not null default 'pending',
 cover_image text, confidence text, historical_context text, public_access text,
 sources jsonb not null default '[]'::jsonb, location_precision text not null default 'approximate' check(location_precision in ('exact','approximate','generalized')),
 last_verified_at timestamptz, created_by uuid references public.profiles(id) on delete set null,
 submission_id uuid unique, is_demo boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index locations_geog_idx on public.locations using gist(geog);
create index locations_category_idx on public.locations(category);
create index locations_updated_idx on public.locations(updated_at desc);
create table public.submissions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
 title text not null check(length(title) between 3 and 120), category text not null,
 description text not null check(length(description) between 30 and 4000), area text not null,
 latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 geog geography(point,4326) generated always as (st_setsrid(st_makepoint(longitude,latitude),4326)::geography) stored,
 sources jsonb not null default '[]'::jsonb, image_paths jsonb not null default '[]'::jsonb,
 public_access text not null default 'Unknown', status public.publication_status not null default 'pending',
 moderation_note text, reviewed_by uuid references public.profiles(id) on delete set null, reviewed_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index submissions_geog_idx on public.submissions using gist(geog);
create index submissions_status_idx on public.submissions(status,created_at);
alter table public.locations add constraint locations_submission_fk foreign key(submission_id) references public.submissions(id) on delete set null;
create table public.location_images(id uuid primary key default gen_random_uuid(),location_id uuid not null references public.locations(id) on delete cascade,storage_path text not null,alt_text text,sort_order int not null default 0,created_at timestamptz not null default now());
create table public.favorites(user_id uuid not null references public.profiles(id) on delete cascade,location_id uuid not null references public.locations(id) on delete cascade,created_at timestamptz not null default now(),primary key(user_id,location_id));
create table public.location_reports(id uuid primary key default gen_random_uuid(),location_id uuid not null references public.locations(id) on delete cascade,reporter_id uuid references public.profiles(id) on delete set null,reason text not null check(reason in ('occupied','unsafe','incorrect','private_property','sensitive_site','other')),details text check(details is null or length(details)<=2000),status text not null default 'open' check(status in ('open','reviewing','resolved','dismissed')),created_at timestamptz not null default now(),resolved_by uuid references public.profiles(id) on delete set null,resolved_at timestamptz);
create table public.comments(id uuid primary key default gen_random_uuid(),location_id uuid not null references public.locations(id) on delete cascade,user_id uuid not null references public.profiles(id) on delete cascade,body text not null check(length(body) between 2 and 1500),status text not null default 'visible' check(status in ('visible','hidden')),created_at timestamptz not null default now());
create table public.ai_discovery_candidates(id uuid primary key default gen_random_uuid(),created_by uuid references public.profiles(id) on delete set null,query text not null,provider text not null,evidence jsonb not null default '[]'::jsonb,confidence text not null,latitude double precision,longitude double precision,status public.publication_status not null default 'pending',moderation_note text,created_at timestamptz not null default now());
create table public.moderation_actions(id uuid primary key default gen_random_uuid(),submission_id uuid references public.submissions(id) on delete set null,admin_id uuid not null references public.profiles(id) on delete restrict,action text not null,note text,created_at timestamptz not null default now());
create table public.audit_logs(id uuid primary key default gen_random_uuid(),actor_id uuid references public.profiles(id) on delete set null,action text not null,entity_type text not null,entity_id uuid,metadata jsonb not null default '{}'::jsonb,created_at timestamptz not null default now());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,display_name) values(new.id,coalesce(new.raw_user_meta_data->>'name','Explorer')); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();
create or replace function public.find_nearby_submissions(p_lat double precision,p_lon double precision,p_meters integer default 150) returns table(id uuid,status public.publication_status,distance_m double precision) language sql security definer set search_path=public as $$ select s.id,s.status,st_distance(s.geog,st_setsrid(st_makepoint(p_lon,p_lat),4326)::geography) from public.submissions s where st_dwithin(s.geog,st_setsrid(st_makepoint(p_lon,p_lat),4326)::geography,p_meters) and s.status in ('pending','approved','needs_info') limit 10; $$;
revoke all on function public.find_nearby_submissions(double precision,double precision,integer) from public,anon;
grant execute on function public.find_nearby_submissions(double precision,double precision,integer) to authenticated;

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.submissions enable row level security;
alter table public.location_images enable row level security;
alter table public.favorites enable row level security;
alter table public.location_reports enable row level security;
alter table public.comments enable row level security;
alter table public.ai_discovery_candidates enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_logs enable row level security;
create policy "public profiles limited read" on public.profiles for select to authenticated using (true);
create or replace function public.current_user_role() returns public.user_role language sql stable security definer set search_path=public as $$ select role from public.profiles where id=auth.uid() $$;
create policy "profile owner update" on public.profiles for update to authenticated using (auth.uid()=id) with check (auth.uid()=id and role=public.current_user_role());
create policy "public sees approved locations" on public.locations for select to anon,authenticated using(status='approved');
create policy "owners read own submissions" on public.submissions for select to authenticated using(user_id=auth.uid() or public.current_user_role() in ('admin','moderator'));
create policy "authenticated submit pending only" on public.submissions for insert to authenticated with check(user_id=auth.uid() and status='pending');
create policy "owners update own pending" on public.submissions for update to authenticated using(user_id=auth.uid() and status in ('pending','needs_info')) with check(user_id=auth.uid() and status in ('pending','needs_info'));
create policy "images for public locations" on public.location_images for select to anon,authenticated using(exists(select 1 from public.locations l where l.id=location_id and l.status='approved'));
create policy "users manage own favorites" on public.favorites for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users create reports" on public.location_reports for insert to authenticated with check(reporter_id=auth.uid());
create policy "users see own reports" on public.location_reports for select to authenticated using(reporter_id=auth.uid() or public.current_user_role() in ('admin','moderator'));
create policy "public sees visible comments" on public.comments for select to anon,authenticated using(status='visible' and exists(select 1 from public.locations l where l.id=location_id and l.status='approved'));
create policy "signed in comments" on public.comments for insert to authenticated with check(user_id=auth.uid());
create policy "users see own ai candidates" on public.ai_discovery_candidates for select to authenticated using(created_by=auth.uid() or public.current_user_role() in ('admin','moderator'));
create policy "users create ai candidates" on public.ai_discovery_candidates for insert to authenticated with check(created_by=auth.uid() and status='pending');
create policy "moderators read moderation actions" on public.moderation_actions for select to authenticated using(public.current_user_role() in ('admin','moderator'));
create policy "admins read audit logs" on public.audit_logs for select to authenticated using(public.current_user_role()='admin');
-- Administrative writes use a server-only service-role key after explicit role checks in API routes.
-- Do not expose SUPABASE_SERVICE_ROLE_KEY to client code.
