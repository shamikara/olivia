import { getSupabaseAdminClient, getPublicUrl, removeOptimizedObjects } from "./supabase-client";
import type { MediaEnv } from "./env";
import type {
  ImageRole,
  MediaAsset,
  MediaStatus,
  MediaVariants,
  SyncRun,
  SyncRunStatus,
  SyncTrigger,
} from "./types";

/**
 * Postgres-backed metadata store for the media pipeline (media_assets,
 * sync_runs, storage_cleanup_queue). Mirrors the rest of the app's
 * `xxx-store.ts` convention (plain async get/upsert/delete functions) —
 * this one just talks to Supabase instead of a JSON file, since media
 * metadata is what the project chose to put in a real database.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

function rowToAsset(row: Row): MediaAsset {
  return {
    id: row.id,
    productId: row.product_id,
    sourceKey: row.source_key,
    imageRole: row.image_role,
    sortOrder: row.sort_order,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    originalSize: row.original_size,
    checksum: row.checksum,
    sourceModifiedTime: row.source_modified_time,
    variants: row.variants,
    optimizedSize: row.optimized_size,
    width: row.width,
    height: row.height,
    version: row.version,
    status: row.status,
    errorMessage: row.error_message,
    missingSince: row.missing_since,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

function rowToSyncRun(row: Row): SyncRun {
  return {
    id: row.id,
    trigger: row.trigger,
    status: row.status,
    startedAt: row.started_at,
    finishedAt: row.finished_at,
    filesDiscovered: row.files_discovered,
    filesChanged: row.files_changed,
    filesSkipped: row.files_skipped,
    filesFailed: row.files_failed,
    errorSummary: row.error_summary,
  };
}

export async function getActiveAssetForRole(
  env: MediaEnv,
  productId: string,
  role: ImageRole,
): Promise<MediaAsset | null> {
  const client = getSupabaseAdminClient(env);
  const { data, error } = await client
    .from("media_assets")
    .select("*")
    .eq("product_id", productId)
    .eq("image_role", role)
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new Error(`media_assets lookup failed: ${error.message}`);
  return data ? rowToAsset(data) : null;
}

export async function listAssetsForProduct(env: MediaEnv, productId: string): Promise<MediaAsset[]> {
  const client = getSupabaseAdminClient(env);
  const { data, error } = await client
    .from("media_assets")
    .select("*")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(`media_assets lookup failed: ${error.message}`);
  return (data ?? []).map(rowToAsset);
}

export interface NewAssetInput {
  productId: string;
  sourceKey: string;
  imageRole: ImageRole;
  originalFilename: string;
  mimeType: string;
  originalSize: number;
  checksum: string | null;
  sourceModifiedTime: string;
  variants: MediaVariants;
  optimizedSize: number;
  width: number;
  height: number;
  status: MediaStatus;
}

export async function insertActiveAsset(env: MediaEnv, input: NewAssetInput): Promise<MediaAsset> {
  const client = getSupabaseAdminClient(env);
  const { data, error } = await client
    .from("media_assets")
    .insert({
      product_id: input.productId,
      source_key: input.sourceKey,
      image_role: input.imageRole,
      original_filename: input.originalFilename,
      mime_type: input.mimeType,
      original_size: input.originalSize,
      checksum: input.checksum,
      source_modified_time: input.sourceModifiedTime,
      variants: input.variants,
      optimized_size: input.optimizedSize,
      width: input.width,
      height: input.height,
      status: input.status,
    })
    .select()
    .single();
  if (error) throw new Error(`media_assets insert failed: ${error.message}`);
  return rowToAsset(data);
}

export async function insertFailedAsset(
  env: MediaEnv,
  input: { productId: string; sourceKey: string | null; imageRole: ImageRole; errorMessage: string },
): Promise<void> {
  const client = getSupabaseAdminClient(env);
  const { error } = await client.from("media_assets").insert({
    product_id: input.productId,
    source_key: input.sourceKey ?? `failed-${crypto.randomUUID()}`,
    image_role: input.imageRole,
    status: "failed",
    error_message: input.errorMessage,
  });
  if (error) throw new Error(`media_assets insert failed: ${error.message}`);
}

export async function updateAsset(
  env: MediaEnv,
  id: string,
  patch: Partial<{
    status: MediaStatus;
    errorMessage: string | null;
    missingSince: string | null;
    checksum: string | null;
    sourceModifiedTime: string;
    variants: MediaVariants;
    optimizedSize: number;
    width: number;
    height: number;
    version: number;
    imageRole: ImageRole;
  }>,
): Promise<void> {
  const client = getSupabaseAdminClient(env);
  const patchRow: Row = { updated_at: new Date().toISOString() };
  if (patch.status !== undefined) patchRow.status = patch.status;
  if (patch.errorMessage !== undefined) patchRow.error_message = patch.errorMessage;
  if (patch.missingSince !== undefined) patchRow.missing_since = patch.missingSince;
  if (patch.checksum !== undefined) patchRow.checksum = patch.checksum;
  if (patch.sourceModifiedTime !== undefined) patchRow.source_modified_time = patch.sourceModifiedTime;
  if (patch.variants !== undefined) patchRow.variants = patch.variants;
  if (patch.optimizedSize !== undefined) patchRow.optimized_size = patch.optimizedSize;
  if (patch.width !== undefined) patchRow.width = patch.width;
  if (patch.height !== undefined) patchRow.height = patch.height;
  if (patch.version !== undefined) patchRow.version = patch.version;
  if (patch.imageRole !== undefined) patchRow.image_role = patch.imageRole;

  const { error } = await client.from("media_assets").update(patchRow).eq("id", id);
  if (error) throw new Error(`media_assets update failed: ${error.message}`);
}

export async function enqueueCleanup(env: MediaEnv, paths: string[], reason: string): Promise<void> {
  if (paths.length === 0) return;
  const client = getSupabaseAdminClient(env);
  const purgeAfter = new Date(Date.now() + env.cleanupGraceHours * 3_600_000).toISOString();
  const { error } = await client
    .from("storage_cleanup_queue")
    .insert(paths.map((supabase_path) => ({ supabase_path, reason, purge_after: purgeAfter })));
  if (error) throw new Error(`storage_cleanup_queue insert failed: ${error.message}`);
}

/** Marks an asset superseded/deleted and queues its optimized files for later removal. */
export async function retireAsset(
  env: MediaEnv,
  asset: MediaAsset,
  status: "superseded" | "deleted",
  reason: string,
): Promise<void> {
  const client = getSupabaseAdminClient(env);
  const { error } = await client
    .from("media_assets")
    .update({ status, deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", asset.id);
  if (error) throw new Error(`media_assets update failed: ${error.message}`);

  if (asset.variants) {
    const paths = [asset.variants.thumb.path, asset.variants.medium.path, asset.variants.large.path];
    await enqueueCleanup(env, paths, reason);
  }
}

/**
 * Called after a product save. Catches image replacements/removals that
 * happened through means other than the upload route itself (e.g. the
 * "Remove" button, which only clears the field client-side) — any active
 * asset whose public URL the product no longer references gets retired.
 */
export async function reconcileProductMedia(
  env: MediaEnv,
  productId: string,
  currentUrls: { main: string | undefined; secondary: string | undefined },
): Promise<void> {
  for (const role of ["main", "secondary"] as const) {
    const active = await getActiveAssetForRole(env, productId, role);
    if (!active?.variants) continue;
    const activeUrl = getPublicUrl(env, active.variants.medium.path);
    if (activeUrl !== currentUrls[role]) {
      await retireAsset(env, active, "superseded", `Product no longer references this ${role} image`);
    }
  }
}

/** Called after a product is deleted outright — retires every asset it owned. */
export async function retireAllAssetsForProduct(env: MediaEnv, productId: string): Promise<void> {
  const assets = await listAssetsForProduct(env, productId);
  for (const asset of assets) {
    if (asset.status === "deleted") continue;
    await retireAsset(env, asset, "deleted", "Product was deleted");
  }
}

const STALE_RUN_MS = 30 * 60_000;

/** Returns null if a non-stale run is in progress (acts as the concurrency lock). */
export async function startSyncRun(env: MediaEnv, trigger: SyncTrigger): Promise<SyncRun | null> {
  const client = getSupabaseAdminClient(env);
  const { data: running, error: runningError } = await client
    .from("sync_runs")
    .select("*")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (runningError) throw new Error(`sync_runs lookup failed: ${runningError.message}`);

  if (running) {
    const startedAt = new Date(running.started_at).getTime();
    if (Date.now() - startedAt < STALE_RUN_MS) return null;
    // Stale: a previous run crashed without finishing. Mark it failed and proceed.
    await client
      .from("sync_runs")
      .update({ status: "failed", finished_at: new Date().toISOString(), error_summary: "Run timed out or crashed" })
      .eq("id", running.id);
  }

  const { data, error } = await client.from("sync_runs").insert({ trigger, status: "running" }).select().single();
  if (error) throw new Error(`sync_runs insert failed: ${error.message}`);
  return rowToSyncRun(data);
}

export async function finishSyncRun(
  env: MediaEnv,
  id: string,
  patch: {
    status: SyncRunStatus;
    filesDiscovered: number;
    filesChanged: number;
    filesSkipped: number;
    filesFailed: number;
    errorSummary?: string;
  },
): Promise<void> {
  const client = getSupabaseAdminClient(env);
  const { error } = await client
    .from("sync_runs")
    .update({
      status: patch.status,
      finished_at: new Date().toISOString(),
      files_discovered: patch.filesDiscovered,
      files_changed: patch.filesChanged,
      files_skipped: patch.filesSkipped,
      files_failed: patch.filesFailed,
      error_summary: patch.errorSummary ?? null,
    })
    .eq("id", id);
  if (error) throw new Error(`sync_runs update failed: ${error.message}`);
}

export async function getLatestSyncRun(env: MediaEnv): Promise<SyncRun | null> {
  const client = getSupabaseAdminClient(env);
  const { data, error } = await client
    .from("sync_runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`sync_runs lookup failed: ${error.message}`);
  return data ? rowToSyncRun(data) : null;
}

/** Physically removes optimized files whose grace period has passed. Safe to call often. */
export async function runDueCleanup(env: MediaEnv): Promise<{ purged: number; failed: number }> {
  const client = getSupabaseAdminClient(env);
  const { data, error } = await client
    .from("storage_cleanup_queue")
    .select("*")
    .is("purged_at", null)
    .lte("purge_after", new Date().toISOString())
    .limit(200);
  if (error) throw new Error(`storage_cleanup_queue lookup failed: ${error.message}`);

  let purged = 0;
  let failed = 0;
  for (const row of data ?? []) {
    try {
      await removeOptimizedObjects(env, [row.supabase_path]);
      await client.from("storage_cleanup_queue").update({ purged_at: new Date().toISOString() }).eq("id", row.id);
      purged += 1;
    } catch (error) {
      console.error(`[media] cleanup failed for ${row.supabase_path}:`, (error as Error).message);
      failed += 1;
    }
  }
  return { purged, failed };
}
