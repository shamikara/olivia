import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findAdminByEmail, createPasswordReset, consumePasswordReset } from "../../../../lib/admin-store";
import { sendEmail } from "../../../../lib/email/send";
import { adminPasswordResetEmail } from "../../../../lib/email/templates";
import { siteOrigin } from "../../../../lib/site-url";
import { MIN_PASSWORD_LENGTH } from "../../../../lib/password-policy";

export const dynamic = "force-dynamic";

const TTL_MINUTES = 60;

/**
 * Requests a reset link.
 *
 * Answers the same way whether or not the address has an account. Anything
 * else turns this into a way to discover admin addresses, and it is reachable
 * without signing in.
 */
export async function POST(request: NextRequest) {
  let body: { email?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const ok = NextResponse.json({
    ok: true,
    message: "If that address has an admin account, a reset link is on its way.",
  });
  if (!email) return ok;

  const admin = await findAdminByEmail(email);
  if (!admin || admin.disabled) return ok;

  const { token } = await createPasswordReset(admin.id);
  const url = `${siteOrigin(request)}/admin/login?reset=${encodeURIComponent(token)}`;

  await sendEmail(admin.email, adminPasswordResetEmail(admin.name, url, TTL_MINUTES));
  return ok;
}

/** Redeems a reset token and sets the new password. */
export async function PUT(request: NextRequest) {
  let body: { token?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const token = (body.token ?? "").trim();
  const password = body.password ?? "";

  if (!token) return NextResponse.json({ error: "Missing reset token" }, { status: 400 });
  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` },
      { status: 422 },
    );
  }

  const admin = await consumePasswordReset(token, password);
  if (!admin) {
    return NextResponse.json(
      { error: "That reset link is invalid, expired, or already used" },
      { status: 400 },
    );
  }

  // Deliberately not signed in here: knowing the new password should be what
  // gets you in, and it proves the change actually took.
  return NextResponse.json({ ok: true, email: admin.email });
}
