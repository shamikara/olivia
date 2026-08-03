import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findById, toPublic, updateCustomer } from "../../../lib/customer-store";
import { CUSTOMER_COOKIE, readCustomerToken } from "../../../lib/customer-auth";

async function requireCustomer(request: NextRequest) {
  const claims = await readCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
  if (!claims) return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) };
  const customer = await findById(claims.sub);
  if (!customer) return { error: NextResponse.json({ error: "Account not found" }, { status: 404 }) };
  return { customer };
}

export async function GET(request: NextRequest) {
  const result = await requireCustomer(request);
  if (result.error) return result.error;
  return NextResponse.json({ customer: toPublic(result.customer) });
}

export async function PUT(request: NextRequest) {
  const result = await requireCustomer(request);
  if (result.error) return result.error;

  let body: { name?: string; phone?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 422 });

  const updated = await updateCustomer(result.customer.id, { name, phone: body.phone?.trim() || undefined });
  return NextResponse.json({ customer: updated ? toPublic(updated) : null });
}
