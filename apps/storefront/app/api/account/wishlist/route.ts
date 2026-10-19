import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { findById, updateCustomer } from "../../../lib/customer-store";
import { CUSTOMER_COOKIE, readCustomerToken } from "../../../lib/customer-auth";

export const dynamic = "force-dynamic";

/**
 * The signed-in customer's saved items.
 *
 * Guests get 401 and the browser keeps its local list — that is not an error
 * worth surfacing, it is simply what a wishlist means before you have an
 * account.
 */
async function customerFrom(request: NextRequest) {
  const claims = await readCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
  return claims ? findById(claims.sub) : undefined;
}

const clean = (value: unknown): string[] =>
  Array.isArray(value)
    ? value
        .map((entry) => String(entry).trim())
        .filter(Boolean)
        .filter((entry, index, all) => all.indexOf(entry) === index)
        .slice(0, 200)
    : [];

export async function GET(request: NextRequest) {
  const customer = await customerFrom(request);
  if (!customer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ wishlist: customer.wishlist });
}

/**
 * Merges rather than replaces.
 *
 * Someone who hearts items as a guest and then signs in must not lose them,
 * and a second device must not wipe what the first one saved. Removal is
 * therefore explicit: the client sends the full list it wants kept, with
 * `replace: true`, only when the shopper actually unhearted something.
 */
export async function PUT(request: NextRequest) {
  const customer = await customerFrom(request);
  if (!customer) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  let body: { wishlist?: unknown; replace?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const incoming = clean(body.wishlist);
  const next = body.replace
    ? incoming
    : [...customer.wishlist, ...incoming.filter((id) => !customer.wishlist.includes(id))];

  const updated = await updateCustomer(customer.id, { wishlist: next });
  return NextResponse.json({ wishlist: updated?.wishlist ?? next });
}
