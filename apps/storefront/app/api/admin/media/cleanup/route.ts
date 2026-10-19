import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { runMediaCleanup } from "../../../../lib/media/sync-service";

/** Manual "Clean up now" trigger from the admin panel. */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const summary = await runMediaCleanup("manual");
  if (summary.skipped) {
    const message =
      summary.reason === "already_running"
        ? "A cleanup is already running — try again shortly."
        : "Media storage is not configured yet.";
    return NextResponse.json({ ok: false, message }, { status: summary.reason === "already_running" ? 409 : 400 });
  }

  return NextResponse.json({
    ok: summary.failed === 0,
    message:
      summary.failed === 0
        ? `Cleaned up. ${summary.purged} replaced file(s) removed.`
        : `Removed ${summary.purged} file(s), ${summary.failed} could not be deleted.`,
    summary,
  });
}
