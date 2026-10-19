import { createHash, randomUUID } from "node:crypto";
import { getMediaEnv, type MediaEnv } from "./env";
import { processImage, ImageValidationError, type ProcessedImage } from "./image-processor";
import { uploadOptimizedVariant, getPublicUrl } from "./supabase-client";
import * as store from "./media-store";
import type { ImageRole, MediaVariants, SyncTrigger } from "./types";

/**
 * Product media: admin upload in, optimized variants out, Supabase Storage
 * for both.
 *
 * This used to keep originals in Google Drive and reconcile them on a
 * schedule. Drive is gone: an upload is now processed and published in one
 * pass, which removes a credential set, a sync job and the entire class of
 * failure where the folder behind a product moved or was renamed.
 *
 * What survives is the part that was actually load-bearing — a replaced image
 * is never deleted immediately. Its variants are queued and purged only after
 * a grace period, so a bad upload can be rolled back and a stale CDN or page
 * reference doesn't 404 in the meantime.
 */

async function storeVariants(
  env: MediaEnv,
  productId: string,
  role: ImageRole,
  sourceKey: string,
  version: number,
  processed: ProcessedImage,
): Promise<MediaVariants> {
  const shortId = sourceKey.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const variants = {} as Record<"thumb" | "medium" | "large", MediaVariants["thumb"]>;
  for (const size of ["thumb", "medium", "large"] as const) {
    const variant = processed.variants[size];
    const path = `products/${productId}/${role}-${shortId}-v${version}-${size}.webp`;
    await uploadOptimizedVariant(env, path, variant.buffer);
    variants[size] = { path, width: variant.width, height: variant.height, size: variant.size };
  }
  return variants as MediaVariants;
}

/**
 * Used by the admin upload endpoint: validates, optimizes and publishes one
 * image, then retires whatever it replaced.
 *
 * Ordering matters. The new variants are uploaded and the new row is inserted
 * before the previous asset is retired, so a failure at any point leaves the
 * existing image live rather than a product with no photo.
 */
export async function ingestAdminUpload(
  productId: string,
  role: Exclude<ImageRole, "unassigned">,
  buffer: Buffer,
  mimeType: string,
  originalFilename: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const env = getMediaEnv();
  if (!env) return { ok: false, message: "Media storage is not configured" };

  let processed: ProcessedImage;
  try {
    processed = await processImage(buffer, mimeType);
  } catch (error) {
    const message = error instanceof ImageValidationError ? error.message : "Could not process this image";
    return { ok: false, message };
  }

  // Identity for the asset. Drive used to supply this; now it is ours, and a
  // fresh one per upload is what keeps the storage paths of a replacement
  // distinct from the image it supersedes.
  const sourceKey = `up_${randomUUID()}`;

  try {
    const previous = await store.getActiveAssetForRole(env, productId, role);
    const version = previous ? previous.version + 1 : 1;
    const variants = await storeVariants(env, productId, role, sourceKey, version, processed);
    const optimizedSize = variants.thumb.size + variants.medium.size + variants.large.size;

    await store.insertActiveAsset(env, {
      productId,
      sourceKey,
      imageRole: role,
      originalFilename,
      mimeType,
      originalSize: buffer.byteLength,
      // Of the uploaded bytes, so a re-upload of the identical file is still
      // recognisable as such.
      checksum: createHash("md5").update(buffer).digest("hex"),
      sourceModifiedTime: new Date().toISOString(),
      variants,
      optimizedSize,
      width: processed.width,
      height: processed.height,
      status: "active",
    });

    if (previous) {
      await store.retireAsset(env, previous, "superseded", "Replaced by a new admin upload");
    }

    console.log(`[media] admin upload published: ${productId}/${role} (${sourceKey})`);
    return { ok: true, url: getPublicUrl(env, variants.medium.path) };
  } catch (error) {
    const message = (error as Error).message;
    console.error("[media] admin upload failed:", message);
    await store
      .insertFailedAsset(env, { productId, sourceKey, imageRole: role, errorMessage: message })
      .catch(() => {});
    return {
      ok: false,
      message: "Could not publish the image. The previous image is still active.",
    };
  }
}

export interface CleanupSummary {
  skipped: boolean;
  reason?: string;
  purged: number;
  failed: number;
}

/**
 * Purges optimized files whose grace period has passed.
 *
 * All that remains of the old scheduled job. Safe to call often: the queue
 * only yields rows that are actually due, and the run lock stops two sweeps
 * overlapping.
 */
export async function runMediaCleanup(trigger: SyncTrigger): Promise<CleanupSummary> {
  const env = getMediaEnv();
  if (!env) {
    console.log("[media] cleanup skipped: Supabase is not configured");
    return { skipped: true, reason: "not_configured", purged: 0, failed: 0 };
  }

  const run = await store.startSyncRun(env, trigger);
  if (!run) {
    console.log("[media] cleanup skipped: another run is already in progress");
    return { skipped: true, reason: "already_running", purged: 0, failed: 0 };
  }

  try {
    const { purged, failed } = await store.runDueCleanup(env);
    await store.finishSyncRun(env, run.id, {
      status: failed > 0 ? (purged > 0 ? "partial" : "failed") : "success",
      filesDiscovered: 0,
      filesChanged: purged,
      filesSkipped: 0,
      filesFailed: failed,
    });
    console.log(`[media] cleanup finished: purged=${purged} failed=${failed}`);
    return { skipped: false, purged, failed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[media] cleanup aborted:", message);
    await store.finishSyncRun(env, run.id, {
      status: "failed",
      filesDiscovered: 0,
      filesChanged: 0,
      filesSkipped: 0,
      filesFailed: 0,
      errorSummary: message,
    });
    return { skipped: false, purged: 0, failed: 1 };
  }
}
