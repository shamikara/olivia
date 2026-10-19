import { NextResponse } from "next/server";
import { signAdminToken } from "@olivia/auth";
import { authenticateAdmin, recordAdminLogin } from "../../../lib/admin-store";

/**
 * Administrator sign-in.
 *
 * Checks the submitted password against the scrypt hash in admin_users. There
 * is deliberately no fallback: an unconfigured or empty table means nobody can
 * sign in, rather than a default password working. The previous version
 * compared a plaintext value against an env var defaulting to "admin123" and
 * issued a token for a fixed user whoever signed in.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const admin = await authenticateAdmin(String(email), String(password));
    if (!admin) {
      // One message for a wrong password, an unknown address and a disabled
      // account alike — telling them apart turns this form into a way to find
      // out who holds an account.
      return NextResponse.json({ error: "Invalid email address or password" }, { status: 401 });
    }

    const user = {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      // Initials for the sidebar badge, from the real account rather than a
      // hardcoded "OC".
      avatar: admin.name
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase(),
    };

    const token = await signAdminToken(user);
    await recordAdminLogin(admin.id);

    const response = NextResponse.json({
      success: true,
      user,
      mustChangePassword: admin.mustChangePassword,
    });

    response.cookies.set({
      name: "admin_token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during sign in" },
      { status: 500 },
    );
  }
}
