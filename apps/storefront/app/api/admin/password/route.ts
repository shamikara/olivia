import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAdminToken } from "@olivia/auth";
import { requireAdmin } from "../../../lib/admin-auth";
import { checkAdminPassword, setAdminPassword } from "../../../lib/admin-store";
import { MIN_PASSWORD_LENGTH } from "../../../lib/password-policy";

/** Changes the signed-in administrator's own password. */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const payload = await verifyAdminToken(request.cookies.get("admin_token")?.value ?? "");
  if (!payload) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const current = body.currentPassword ?? "";
  const next = body.newPassword ?? "";

  if (next.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 422 },
    );
  }
  if (next === current) {
    return NextResponse.json({ error: "New password must be different" }, { status: 422 });
  }

  // Re-checked even though the session is valid: a borrowed, unlocked browser
  // should not be enough to lock the real owner out of their own account.
  if (!(await checkAdminPassword(payload.sub, current))) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  await setAdminPassword(payload.sub, next);
  return NextResponse.json({ ok: true });
}
