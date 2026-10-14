-- ==============================================================================
-- MBT Platform Database Migration: Admins Table Phone Column
-- Mission Better Tomorrow Administrator System
-- ==============================================================================

-- 1. Ensure public.admins table exists with all standard columns
create table if not exists public.admins (
  id bigint generated always as identity not null,
  name text not null,
  email text not null,
  password text not null,
  phone text null,
  status text not null default 'inactive'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint admins_pkey primary key (id),
  constraint admins_email_key unique (email)
) tablespace pg_default;

-- 2. Add 'phone' column if it does not already exist
alter table public.admins add column if not exists phone text;

-- 3. Add 'status' column if it does not already exist
alter table public.admins add column if not exists status text not null default 'inactive'::text;

-- 4. Create an index on phone for fast lookups
create index if not exists idx_admins_phone on public.admins (phone);

-- 5. Optional: Authorized admin phones reference table for database-driven authorization
create table if not exists public.authorized_admin_phones (
  id bigint generated always as identity not null,
  phone text not null unique,
  note text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint authorized_admin_phones_pkey primary key (id)
) tablespace pg_default;

-- Seed default authorized administrator phone (9876543210)
insert into public.authorized_admin_phones (phone, note)
values ('9876543210', 'Primary Default Authorized Admin')
on conflict (phone) do nothing;

-- 6. Ensure Row Level Security is active
alter table public.admins enable row level security;
alter table public.authorized_admin_phones enable row level security;

-- Policy to allow all operations for admin authentication
drop policy if exists "Allow all operations for admins" on public.admins;
create policy "Allow all operations for admins" on public.admins for all using (true) with check (true);

drop policy if exists "Allow all operations for authorized_admin_phones" on public.authorized_admin_phones;
create policy "Allow all operations for authorized_admin_phones" on public.authorized_admin_phones for all using (true) with check (true);
