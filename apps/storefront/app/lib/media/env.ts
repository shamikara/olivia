/**
 * Central env access for the media pipeline. Kept in one place (unlike the
 * rest of the app's ad-hoc `process.env.X` reads) because this subsystem has
 * enough variables that scattering them would make it impossible to tell
 * what's actually required.
 *
 * These are the same Supabase credentials the application database uses —
 * one project serves both — so media is configured the moment the database is.
 */

export interface MediaEnv {
  supabaseUrl: string;
  supabaseServiceRoleKey: string;
  supabaseBucket: string;
  cleanupGraceHours: number;
  cleanupIntervalHours: number;
  cronSecret: string | null;
}

function readMediaEnv(): MediaEnv | null {
  const {
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_MEDIA_BUCKET,
    MEDIA_CLEANUP_INTERVAL_HOURS,
    MEDIA_CLEANUP_GRACE_HOURS,
    CRON_SECRET,
  } = process.env;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  return {
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    supabaseBucket: SUPABASE_MEDIA_BUCKET || "product-media",
    cleanupGraceHours: Number(MEDIA_CLEANUP_GRACE_HOURS) || 168,
    cleanupIntervalHours: Number(MEDIA_CLEANUP_INTERVAL_HOURS) || 24,
    // Named to match Vercel Cron's own convention: when set, Vercel attaches
    // `Authorization: Bearer $CRON_SECRET` to its scheduled requests
    // automatically. An external scheduler must add that header itself.
    cronSecret: CRON_SECRET || null,
  };
}

/** Null when Supabase isn't configured (e.g. local dev). */
export function getMediaEnv(): MediaEnv | null {
  return readMediaEnv();
}

export function isMediaPipelineConfigured(): boolean {
  return readMediaEnv() !== null;
}
