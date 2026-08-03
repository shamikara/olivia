import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteAddress, findById, saveAddress, toPublic } from "../../../lib/customer-store";
import { CUSTOMER_COOKIE, readCustomerToken } from "../../../lib/customer-auth";

async function customerFrom(request: NextRequest) {
  const claims = await readCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
  return claims ? findById(claims.sub) : undefined;
}

const required = ["fullName", "phone", "line1", "city"] as const;

export async function POST(request: NextRequest) {
  const customer = await customerFrom(request);
  if (!customer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  for (const field of required) {
    if (!String(body[field] ?? "").trim()) {
      return NextResponse.json({ error: `${field} is required` }, { status: 422 });
    }
  }

  const text = (key: string) => String(body[key] ?? "").trim();
  const updated = await saveAddress(customer.id, {
    id: text("id") || undefined,
    label: text("label") || "Home",
    fullName: text("fullName"),
    phone: text("phone"),
    line1: text("line1"),
    line2: text("line2") || undefined,
    city: text("city"),
    district: text("district") || undefined,
    postalCode: text("postalCode") || undefined,
    isDefault: Boolean(body.isDefault),
  });

  return NextResponse.json({ customer: updated ? toPublic(updated) : null }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const customer = await customerFrom(request);
  if (!customer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Address id is required" }, { status: 400 });

  const updated = await deleteAddress(customer.id, id);
  return NextResponse.json({ customer: updated ? toPublic(updated) : null });
}
