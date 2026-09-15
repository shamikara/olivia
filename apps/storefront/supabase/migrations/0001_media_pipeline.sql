-- Media pipeline: Google Drive (source of truth for originals) -> optimized
-- variants in Supabase Storage, tracked here so a Drive-side accident (a
-- rename, an accidental delete, a bad re-upload) never touches what the
-- website currently serves. Product core fields (name/price/etc.) stay in
-- apps/storefront/data/products.json; this schema only tracks media.

create extension if not exists pgcrypto;

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  -- BeautyProduct.id from products.json (e.g. "p-glow-serum"). Not a foreign
  -- key: products live outside this database.
  product_id text not null,
  -- Google Drive's file id is the only stable identity for an original.
  -- Filenames are cosmetic and may change (renames, "final-final.jpg" etc).
  drive_file_id text not null unique,
  drive_parent_folder_id text,
  image_role text not null default 'unassigned'
    check (image_role in ('main', 'secondary', 'unassigned')),
  sort_order int not null default 0,
  original_filename text,
  mime_type text,
  original_size bigint,
  checksum text,
  drive_modified_time timestamptz,
  -- {thumb: {path, width, height, size}, medium: {...}, large: {...}}
  variants jsonb,
  optimized_size bigint,
  width int,
  height int,
  version int not null default 1,
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'active', 'failed', 'source_missing', 'superseded', 'deleted')),
  error_message text,
  -- First time a sync ran and could not find this file in Drive. Kept as a
  -- soft signal only: the live Supabase copy keeps serving regardless.
  missing_since timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists media_assets_product_id_idx on media_assets (product_id);
create index if not exists media_assets_status_idx on media_assets (status);

create table if not exists sync_runs (
  id uuid primary key default gen_random_uuid(),
  trigger text not null check (trigger in ('manual', 'scheduled')),
  status text not null default 'running' check (status in ('running', 'success', 'failed', 'partial')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  files_discovered int not null default 0,
  files_changed int not null default 0,
  files_skipped int not null default 0,
  files_failed int not null default 0,
  error_summary text
);

create index if not exists sync_runs_started_at_idx on sync_runs (started_at desc);

-- Optimized objects are never deleted the moment they're superseded — only
-- once the replacement is confirmed live, and only after this grace period.
create table if not exists storage_cleanup_queue (
  id uuid primary key default gen_random_uuid(),
  supabase_path text not null,
  reason text,
  queued_at timestamptz not null default now(),
  purge_after timestamptz not null,
  purged_at timestamptz
);

create index if not exists storage_cleanup_queue_pending_idx
  on storage_cleanup_queue (purge_after)
  where purged_at is null;

alter table media_assets enable row level security;
alter table sync_runs enable row level security;
alter table storage_cleanup_queue enable row level security;
-- No policies: only the service-role key (used server-side only, bypasses
-- RLS) reads/writes these tables. The browser never talks to Supabase.

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

drop policy if exists "Public read product-media" on storage.objects;
create policy "Public read product-media" on storage.objects
  for select using (bucket_id = 'product-media');
-- No insert/update/delete policy for anon/authenticated: only the
-- service-role key (server-side) can write to this bucket.
