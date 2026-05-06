-- Certify schema
-- Run this in the Supabase SQL editor of a fresh project.

create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz not null default now()
);

create table if not exists certificates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  certificate_number text not null,
  applicant_name text not null,
  cloudinary_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists certificates_lookup_idx
  on certificates (organization_id, certificate_number);

create table if not exists banner_images (
  id uuid primary key default gen_random_uuid(),
  cloudinary_url text not null,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists site_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

insert into site_settings (key, value) values ('logo_url', null) on conflict do nothing;

-- Row Level Security
alter table organizations enable row level security;
alter table certificates  enable row level security;

-- Public read access (verification flow uses the anon key)
drop policy if exists "orgs_public_read" on organizations;
create policy "orgs_public_read"
  on organizations for select
  using (true);

drop policy if exists "certs_public_read" on certificates;
create policy "certs_public_read"
  on certificates for select
  using (true);

-- Admin writes (the admin panel also uses the anon key in this build,
-- so writes are open. Lock these down to a service role or auth role
-- before exposing the admin URL to the public.)
drop policy if exists "orgs_anon_write" on organizations;
create policy "orgs_anon_write"
  on organizations for all
  using (true)
  with check (true);

drop policy if exists "certs_anon_write" on certificates;
create policy "certs_anon_write"
  on certificates for all
  using (true)
  with check (true);

-- Banner images
alter table banner_images enable row level security;

drop policy if exists "banner_public_read" on banner_images;
create policy "banner_public_read"
  on banner_images for select
  using (true);

drop policy if exists "banner_anon_write" on banner_images;
create policy "banner_anon_write"
  on banner_images for all
  using (true)
  with check (true);

-- Site settings
alter table site_settings enable row level security;

drop policy if exists "settings_public_read" on site_settings;
create policy "settings_public_read"
  on site_settings for select
  using (true);

drop policy if exists "settings_anon_write" on site_settings;
create policy "settings_anon_write"
  on site_settings for all
  using (true)
  with check (true);
