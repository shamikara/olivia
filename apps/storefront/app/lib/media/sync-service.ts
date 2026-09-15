import { getMediaEnv, type MediaEnv } from "./env";
import * as drive from "./google-drive-client";
import type { DriveFileInfo } from "./google-drive-client";
import { processImage, ImageValidationError, type ProcessedImage } from "./image-processor";
import { uploadOptimizedVariant, getPublicUrl } from "./supabase-client";
import * as store from "./media-store";
import { getProducts } from "../product-store";
import type { ImageRole, MediaAsset, MediaVariants, SyncTrigger } from "./types";

async function storeVariants(
  env: MediaEnv,
  productId: string,
  role: ImageRole,
  driveFileId: string,
  version: number,
  processed: ProcessedImage,
): Promise<MediaVariants> {
  const shortId = driveFileId.replace(/[^a-zA-Z0-9]/g, "").slice(0, 10);
  const variants = {} as Record<"thumb" | "medium" | "large", MediaVariants["thumb"]>;
  for (const size of ["thumb", "medium", "large"] as const) {
    const variant = processed.variants[size];
    const path = `products/${productId}/${role}-${shortId}-v${version}-${size}.webp`;
    await uploadOptimizedVariant(env, path, variant.buffer);
    variants[size] = { path, width: variant.width, height: variant.height, size: variant.size };
  }
  return variants as MediaVariants;
}

/** Downloads, validates, processes and stores one Drive file that sync discovered. */
async function ingestDiscoveredFile(
  env: MediaEnv,
  productId: string,
  imagesFolderId: string,
  role: ImageRole,
  file: DriveFileInfo,
  version: number,
  existing: MediaAsset | null,
): Promise<void> {
  const buffer = await drive.downloadFile(env, file.id);
  if (file.size > 0 && buffer.byteLength !== file.size) {
    console.warn(`[media-sync] size mismatch for Drive file ${file.id}: expected ${file.size}, got ${buffer.byteLength}`);
  }

  let processed: ProcessedImage;
  try {
    processed = await processImage(buffer, file.mimeType);
  } catch (error) {
    const message = error instanceof ImageValidationError ? error.message : "Processing failed";
    if (existing) {
      await store.updateAsset(env, existing.id, { status: "failed", errorMessage: message });
    } else {
      await store.insertFailedAsset(env, { productId, driveFileId: file.id, imageRole: role, errorMessage: message });
    }
    throw new Error(message);
  }

  const variants = await storeVariants(env, productId, role, file.id, version, processed);
  const optimizedSize = variants.thumb.size + variants.medium.size + variants.large.size;

  if (existing) {
    await store.updateAsset(env, existing.id, {
      status: "active",
      errorMessage: null,
      missingSince: null,
      checksum: file.md5Checksum,
      driveModifiedTime: file.modifiedTime,
      variants,
      optimizedSize,
      width: processed.width,
      height: processed.height,
      version,
    });
    if (existing.variants) {
      const oldPaths = [existing.variants.thumb.path, existing.variants.medium.path, existing.variants.large.path];
      await store.enqueueCleanup(env, oldPaths, "Superseded by a newer version of the same Drive file");
    }
  } else {
    await store.insertActiveAsset(env, {
      productId,
      driveFileId: file.id,
      driveParentFolderId: imagesFolderId,
      imageRole: role,
      originalFilename: file.name,
      mimeType: file.mimeType,
      originalSize: file.size,
      checksum: file.md5Checksum,
      driveModifiedTime: file.modifiedTime,
      variants,
      optimizedSize,
      width: processed.width,
      height: processed.height,
      status: "active",
    });
  }
}

export interface SyncSummary {
  skipped: boolean;
  reason?: string;
  discovered: number;
  changed: number;
  skippedFiles: number;
  failed: number;
}

/**
 * Reconciles Drive with the database: revalidates already-tracked files
 * (catching in-place edits via checksum/modifiedTime drift), flags files that
 * vanished from Drive without touching what's already live, and catalogs
 * brand-new files found directly in Drive without promoting them to a live
 * product image (that always goes through the admin upload flow instead, so
 * an accidental drop into a shared Drive folder can't become the site photo
 * on its own).
 */
export async function runMediaSync(trigger: SyncTrigger): Promise<SyncSummary> {
  const env = getMediaEnv();
  if (!env) {
    console.log("[media-sync] skipped: Drive/Supabase env vars are not configured");
    return { skipped: true, reason: "not_configured", discovered: 0, changed: 0, skippedFiles: 0, failed: 0 };
  }

  const run = await store.startSyncRun(env, trigger);
  if (!run) {
    console.log("[media-sync] skipped: another sync run is already in progress");
    return { skipped: true, reason: "already_running", discovered: 0, changed: 0, skippedFiles: 0, failed: 0 };
  }

  console.log(`[media-sync] started (${trigger}), run ${run.id}`);
  let discovered = 0;
  let changed = 0;
  let skippedFiles = 0;
  let failed = 0;
  const errors: string[] = [];

  try {
    const validProductIds = new Set((await getProducts()).map((product) => product.id));
    const productFolders = await drive.listProductFolders(env);

    for (const { productId, folderId } of productFolders) {
      if (!validProductIds.has(productId)) {
        console.log(`[media-sync] skipping Drive folder for unknown product "${productId}"`);
        continue;
      }

      const imagesFolderId = await drive.findImagesFolder(env, folderId);
      if (!imagesFolderId) continue;

      const files = await drive.listFilesInFolder(env, imagesFolderId);
      discovered += files.length;
      const seenDriveIds = new Set<string>();

      for (const file of files) {
        seenDriveIds.add(file.id);
        try {
          const existing = await store.getAssetByDriveFileId(env, file.id);

          if (!existing) {
            console.log(`[media-sync] new file ${file.id} ("${file.name}") in ${productId} — cataloging as unassigned`);
            await ingestDiscoveredFile(env, productId, imagesFolderId, "unassigned", file, 1, null);
            changed += 1;
            continue;
          }

          if (existing.status === "deleted") {
            skippedFiles += 1;
            continue;
          }

          const isUnchanged = existing.checksum === file.md5Checksum && existing.driveModifiedTime === file.modifiedTime;
          if (isUnchanged) {
            if (existing.missingSince) await store.updateAsset(env, existing.id, { missingSince: null });
            skippedFiles += 1;
            continue;
          }

          console.log(`[media-sync] change detected for ${file.id} (${productId}/${existing.imageRole})`);
          await ingestDiscoveredFile(env, productId, imagesFolderId, existing.imageRole, file, existing.version + 1, existing);
          changed += 1;
        } catch (error) {
          failed += 1;
          const message = error instanceof Error ? error.message : "Unknown error";
          errors.push(`${productId}/${file.name}: ${message}`);
          console.error(`[media-sync] failed processing ${file.id} (${productId}):`, message);
        }
      }

      const tracked = await store.listAssetsForProduct(env, productId);
      for (const asset of tracked) {
        if (asset.status !== "active" || seenDriveIds.has(asset.driveFileId)) continue;
        if (!asset.missingSince) {
          console.warn(
            `[media-sync] WARNING: Drive file ${asset.driveFileId} for ${productId}/${asset.imageRole} was not found. ` +
              "The live optimized copy is unaffected — investigate the original in Drive.",
          );
          await store.updateAsset(env, asset.id, { missingSince: new Date().toISOString() });
        }
      }
    }

    const cleanup = await store.runDueCleanup(env);
    console.log(`[media-sync] cleanup swept ${cleanup.purged} object(s), ${cleanup.failed} failed`);

    const status = failed > 0 ? (changed + skippedFiles > 0 ? "partial" : "failed") : "success";
    await store.finishSyncRun(env, run.id, {
      status,
      filesDiscovered: discovered,
      filesChanged: changed,
      filesSkipped: skippedFiles,
      filesFailed: failed,
      errorSummary: errors.length ? errors.slice(0, 20).join("; ") : undefined,
    });
    console.log(
      `[media-sync] finished: ${status} (discovered=${discovered} changed=${changed} skipped=${skippedFiles} failed=${failed})`,
    );
    return { skipped: false, discovered, changed, skippedFiles, failed };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[media-sync] run aborted:", message);
    await store.finishSyncRun(env, run.id, {
      status: "failed",
      filesDiscovered: discovered,
      filesChanged: changed,
      filesSkipped: skippedFiles,
      filesFailed: failed,
      errorSummary: message,
    });
    return { skipped: false, discovered, changed, skippedFiles, failed: failed + 1 };
  }
}

/**
 * Used by the admin upload endpoint: uploads a brand-new original straight to
 * its product's Drive folder, then processes and publishes it immediately so
 * the admin doesn't have to wait for the next sync. Any failure after the
 * Drive upload leaves the previous image (if any) untouched and active.
 */
export async function ingestAdminUpload(
  productId: string,
  role: Exclude<ImageRole, "unassigned">,
  buffer: Buffer,
  mimeType: string,
  originalFilename: string,
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const env = getMediaEnv();
  if (!env) return { ok: false, message: "Media pipeline is not configured" };

  let processed: ProcessedImage;
  try {
    processed = await processImage(buffer, mimeType);
  } catch (error) {
    const message = error instanceof ImageValidationError ? error.message : "Could not process this image";
    return { ok: false, message };
  }

  let folderId: string;
  let driveFile: DriveFileInfo;
  try {
    folderId = await drive.getOrCreateProductImagesFolder(env, productId);
    const extension = mimeType.split("/")[1] ?? "bin";
    const filename = `${role}-${Date.now()}.${extension}`;
    driveFile = await drive.uploadOriginal(env, folderId, filename, mimeType, buffer);
  } catch (error) {
    console.error("[media-sync] Drive upload failed:", (error as Error).message);
    return { ok: false, message: "Could not upload the original to Google Drive" };
  }

  try {
    const previous = await store.getActiveAssetForRole(env, productId, role);
    const version = previous ? previous.version + 1 : 1;
    const variants = await storeVariants(env, productId, role, driveFile.id, version, processed);
    const optimizedSize = variants.thumb.size + variants.medium.size + variants.large.size;

    await store.insertActiveAsset(env, {
      productId,
      driveFileId: driveFile.id,
      driveParentFolderId: folderId,
      imageRole: role,
      originalFilename,
      mimeType,
      originalSize: buffer.byteLength,
      checksum: driveFile.md5Checksum,
      driveModifiedTime: driveFile.modifiedTime,
      variants,
      optimizedSize,
      width: processed.width,
      height: processed.height,
      status: "active",
    });

    if (previous) {
      await store.retireAsset(env, previous, "superseded", "Replaced by a new admin upload");
    }

    console.log(`[media-sync] admin upload published: ${productId}/${role} (Drive file ${driveFile.id})`);
    return { ok: true, url: getPublicUrl(env, variants.medium.path) };
  } catch (error) {
    console.error("[media-sync] processing after Drive upload failed:", (error as Error).message);
    return {
      ok: false,
      message: "Image uploaded to Google Drive, but could not be processed. The previous image is still active.",
    };
  }
}
