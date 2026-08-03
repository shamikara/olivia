import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findByEmail, toPublic } from "../../../lib/customer-store";
import { CUSTOMER_COOKIE, signCustomerToken, verifyPassword } from "../../../lib/customer-auth";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const customer = await findByEmail(body.email ?? "");
  const ok = customer ? await verifyPassword(body.password ?? "", customer.passwordHash) : false;

  // One message for both cases, so this can't be used to discover which
  // email addresses have accounts.
  if (!customer || !ok) {
    return NextResponse.json({ error: "Email or password is incorrect" }, { status: 401 });
  }

  const token = await signCustomerToken({ sub: customer.id, email: customer.email, name: customer.name });
  const response = NextResponse.json({ customer: toPublic(customer) });
  response.cookies.set({
    name: CUSTOMER_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
