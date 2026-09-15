import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getMediaEnv } from "../../../../lib/media/env";
import { getLatestSyncRun } from "../../../../lib/media/media-store";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const env = getMediaEnv();
  if (!env) return NextResponse.json({ configured: false });

  const latest = await getLatestSyncRun(env);
  return NextResponse.json({ configured: true, latest });
}
