import { NextResponse } from "next/server";
import { signAdminToken, AdminUser } from "@olivia/auth";

const MOCK_ADMIN_USER: AdminUser = {
  id: "admin-01",
  email: "admin@oliviaglow.com",
  name: "Olivia Chen",
  role: "super_admin",
  avatar: "OC",
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    const validEmail = process.env.ADMIN_EMAIL || "admin@oliviaglow.com";
    const validPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    if (
      email.trim().toLowerCase() !== validEmail.toLowerCase() ||
      password !== validPassword
    ) {
      return NextResponse.json(
        { error: "Invalid email address or password" },
        { status: 401 }
      );
    }

    const token = await signAdminToken(MOCK_ADMIN_USER);

    const response = NextResponse.json({
      success: true,
      user: MOCK_ADMIN_USER,
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
      { status: 500 }
    );
  }
}
