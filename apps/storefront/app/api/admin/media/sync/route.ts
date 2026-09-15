import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { runMediaSync } from "../../../../lib/media/sync-service";

/** Manual "Sync now" trigger from the admin panel. */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const summary = await runMediaSync("manual");
  if (summary.skipped) {
    const message =
      summary.reason === "already_running"
        ? "A sync is already running — try again shortly."
        : "Media sync is not configured yet.";
    return NextResponse.json({ ok: false, message }, { status: summary.reason === "already_running" ? 409 : 400 });
  }

  return NextResponse.json({
    ok: summary.failed === 0,
    message:
      summary.failed === 0
        ? `Synced. ${summary.changed} file(s) updated, ${summary.skippedFiles} unchanged.`
        : `Synced with ${summary.failed} failure(s) — the previous images for those products are still active.`,
    summary,
  });
}
