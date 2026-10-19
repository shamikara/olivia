import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMediaEnv } from "../../../../../lib/media/env";
import { getLatestSyncRun } from "../../../../../lib/media/media-store";
import { runMediaCleanup } from "../../../../../lib/media/sync-service";

/**
 * Scheduled purge of superseded image variants.
 *
 * Not admin-cookie protected (a scheduler has no browser session) — instead
 * requires a bearer secret, so this is never an unauthenticated public
 * endpoint. The cadence lives in MEDIA_CLEANUP_INTERVAL_HOURS: the scheduler
 * may fire more often, and runs within the interval of the last successful
 * one are a no-op, so the interval isn't duplicated into the cron expression.
 */
export async function GET(request: NextRequest) {
  const env = getMediaEnv();
  if (!env?.cronSecret) {
    return NextResponse.json({ error: "Scheduled cleanup is not configured" }, { status: 404 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await getLatestSyncRun(env);
  if (latest && (latest.status === "success" || latest.status === "partial")) {
    const elapsedHours = (Date.now() - new Date(latest.finishedAt ?? latest.startedAt).getTime()) / 3_600_000;
    if (elapsedHours < env.cleanupIntervalHours) {
      console.log(
        `[media] cron: skipping, last run was ${elapsedHours.toFixed(1)}h ago (interval ${env.cleanupIntervalHours}h)`,
      );
      return NextResponse.json({ ok: true, skipped: true, reason: "within_interval" });
    }
  }

  const summary = await runMediaCleanup("scheduled");
  return NextResponse.json({ ok: !summary.skipped && summary.failed === 0, summary });
}
