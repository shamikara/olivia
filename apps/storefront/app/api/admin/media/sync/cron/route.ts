import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getMediaEnv } from "../../../../../lib/media/env";
import { getLatestSyncRun } from "../../../../../lib/media/media-store";
import { runMediaSync } from "../../../../../lib/media/sync-service";

/**
 * Scheduled trigger. Not admin-cookie protected (a scheduler has no browser
 * session) — instead requires a bearer secret, so this is never an
 * unauthenticated public endpoint. The actual cadence lives in one place:
 * MEDIA_SYNC_INTERVAL_HOURS. The scheduler (e.g. vercel.json crons) can fire
 * more often than that; runs within the configured interval of the last
 * successful one are skipped as a no-op, so the interval doesn't have to be
 * duplicated into the scheduler's own cron expression.
 */
export async function GET(request: NextRequest) {
  const env = getMediaEnv();
  if (!env?.cronSecret) {
    return NextResponse.json({ error: "Scheduled sync is not configured" }, { status: 404 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const latest = await getLatestSyncRun(env);
  if (latest && (latest.status === "success" || latest.status === "partial")) {
    const elapsedHours = (Date.now() - new Date(latest.finishedAt ?? latest.startedAt).getTime()) / 3_600_000;
    if (elapsedHours < env.syncIntervalHours) {
      console.log(`[media-sync] cron: skipping, last run was ${elapsedHours.toFixed(1)}h ago (interval ${env.syncIntervalHours}h)`);
      return NextResponse.json({ ok: true, skipped: true, reason: "within_interval" });
    }
  }

  const summary = await runMediaSync("scheduled");
  return NextResponse.json({ ok: !summary.skipped && summary.failed === 0, summary });
}
