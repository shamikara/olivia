-- Google Drive is no longer part of the media pipeline.
--
-- Originals used to be uploaded to a per-product Drive folder and treated as
-- the source of truth, with a scheduled job reconciling Drive against this
-- database. That bought a safety net nobody was using at the cost of a second
-- credential set, a sync job and a whole class of "the folder moved" failures.
-- Images now go straight from the admin panel into Supabase Storage.
--
-- Existing rows are kept and keep working: every optimized variant already in
-- the bucket stays exactly where it is, so nothing the live site serves
-- changes. Only the column names, which referred to a system that is gone.
-- The Drive ids already in source_key are now just opaque historical keys —
-- the originals behind them are no longer reachable, which is the one thing
-- this loses.

-- Guarded so the file is safe to re-run, and so a database created fresh from
-- 0001 in the same sitting lands in the same state as one being migrated.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'media_assets' and column_name = 'drive_file_id'
  ) then
    alter table media_assets rename column drive_file_id to source_key;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_name = 'media_assets' and column_name = 'drive_modified_time'
  ) then
    alter table media_assets rename column drive_modified_time to source_modified_time;
  end if;
end $$;

alter table media_assets drop column if exists drive_parent_folder_id;

-- sync_runs now records cleanup sweeps rather than Drive reconciliation: the
-- scheduled job that remains purges superseded variants once their grace
-- period has passed. files_changed counts objects purged, files_failed counts
-- those that could not be removed; the discovered/skipped counters are no
-- longer meaningful and stay zero.
comment on table sync_runs is
  'History of scheduled media cleanup sweeps. files_changed = objects purged, files_failed = failures.';
