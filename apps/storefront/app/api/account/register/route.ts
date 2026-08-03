import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createCustomer, findByEmail, toPublic } from "../../../lib/customer-store";
import { CUSTOMER_COOKIE, hashPassword, signCustomerToken } from "../../../lib/customer-auth";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  let body: { email?: string; name?: string; phone?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";

  if (!name) return NextResponse.json({ error: "Please enter your name" }, { status: 422 });
  if (!EMAIL.test(email)) return NextResponse.json({ error: "Please enter a valid email address" }, { status: 422 });
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 422 });
  }

  if (await findByEmail(email)) {
    return NextResponse.json({ error: "An account already exists for that email" }, { status: 409 });
  }

  let customer;
  try {
    customer = await createCustomer({
      email,
      name,
      phone: body.phone,
      passwordHash: await hashPassword(password),
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code;
    const message =
      code === "EROFS" || code === "EACCES" || code === "EPERM"
        ? "Accounts need a writable database on this host."
        : "Could not create your account";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const token = await signCustomerToken({ sub: customer.id, email: customer.email, name: customer.name });
  const response = NextResponse.json({ customer: toPublic(customer) }, { status: 201 });
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
