export type ImageRole = "main" | "secondary" | "unassigned";

export type MediaStatus =
  | "pending"
  | "processing"
  | "active"
  | "failed"
  | "source_missing"
  | "superseded"
  | "deleted";

export interface MediaVariant {
  path: string;
  width: number;
  height: number;
  size: number;
}

export interface MediaVariants {
  thumb: MediaVariant;
  medium: MediaVariant;
  large: MediaVariant;
}

export interface MediaAsset {
  id: string;
  productId: string;
  driveFileId: string;
  driveParentFolderId: string | null;
  imageRole: ImageRole;
  sortOrder: number;
  originalFilename: string | null;
  mimeType: string | null;
  originalSize: number | null;
  checksum: string | null;
  driveModifiedTime: string | null;
  variants: MediaVariants | null;
  optimizedSize: number | null;
  width: number | null;
  height: number | null;
  version: number;
  status: MediaStatus;
  errorMessage: string | null;
  missingSince: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type SyncTrigger = "manual" | "scheduled";
export type SyncRunStatus = "running" | "success" | "failed" | "partial";

export interface SyncRun {
  id: string;
  trigger: SyncTrigger;
  status: SyncRunStatus;
  startedAt: string;
  finishedAt: string | null;
  filesDiscovered: number;
  filesChanged: number;
  filesSkipped: number;
  filesFailed: number;
  errorSummary: string | null;
}

/** Human-readable outcome for the admin UI — never raw Drive/Supabase errors. */
export interface UploadOutcome {
  ok: boolean;
  url?: string;
  message: string;
}
