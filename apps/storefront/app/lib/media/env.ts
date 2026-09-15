/**
 * Central env access for the Drive -> Supabase media pipeline. Kept in one
 * place (unlike the rest of the app's ad-hoc `process.env.X` reads) because
 * this subsystem has enough new variables that scattering them would make it
 * impossible to tell what's actually required.
 */

export interface MediaEnv {
  googleServiceAccountEmail: string;
  googlePrivateKey: string;
  googleDriveRootFolderId: string;
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseBucket: string;
  syncIntervalHours: number;
  cleanupGraceHours: number;
  cronSecret: string | null;
}

function readMediaEnv(): MediaEnv | null {
  const {
    GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    GOOGLE_DRIVE_ROOT_FOLDER_ID,
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_MEDIA_BUCKET,
    MEDIA_SYNC_INTERVAL_HOURS,
    MEDIA_CLEANUP_GRACE_HOURS,
    CRON_SECRET,
  } = process.env;

  if (
    !GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    !GOOGLE_DRIVE_ROOT_FOLDER_ID ||
    !SUPABASE_URL ||
    !SUPABASE_SERVICE_ROLE_KEY
  ) {
    return null;
  }

  return {
    googleServiceAccountEmail: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Vercel/most hosts can't store a literal newline in an env var — the key
    // is pasted with escaped "\n" sequences and unescaped here.
    googlePrivateKey: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, "\n"),
    googleDriveRootFolderId: GOOGLE_DRIVE_ROOT_FOLDER_ID,
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    supabaseBucket: SUPABASE_MEDIA_BUCKET || "product-media",
    syncIntervalHours: Number(MEDIA_SYNC_INTERVAL_HOURS) || 24,
    cleanupGraceHours: Number(MEDIA_CLEANUP_GRACE_HOURS) || 168,
    // Named to match Vercel Cron's own convention: when set, Vercel attaches
    // `Authorization: Bearer $CRON_SECRET` to its scheduled requests automatically.
    // An external scheduler must add that header itself using the same value.
    cronSecret: CRON_SECRET || null,
  };
}

/** Null when the Drive/Supabase pipeline isn't configured (e.g. local dev). */
export function getMediaEnv(): MediaEnv | null {
  return readMediaEnv();
}

export function isMediaPipelineConfigured(): boolean {
  return readMediaEnv() !== null;
}
