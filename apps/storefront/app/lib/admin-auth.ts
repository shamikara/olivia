import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const DEFAULT_SECRET = "olivia-glow-jwt-secret-key-2026-luxury-platform";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET || DEFAULT_SECRET);
}

/**
 * Guards admin-only API routes. Middleware already protects the /admin pages,
 * but API routes are reachable directly, so they verify the token themselves.
 *
 * Returns a response to send when access is denied, or null when allowed.
 */
export async function requireAdmin(request: NextRequest): Promise<NextResponse | null> {
  const token = request.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  try {
    await jwtVerify(token, secretKey());
    return null;
  } catch {
    return NextResponse.json({ error: "Session expired, please sign in again" }, { status: 401 });
  }
}
