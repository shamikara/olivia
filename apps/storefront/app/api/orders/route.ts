import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createOrder, ordersForCustomer, type OrderLine } from "../../lib/order-store";
import { findById } from "../../lib/customer-store";
import { CUSTOMER_COOKIE, readCustomerToken } from "../../lib/customer-auth";
import { getProducts } from "../../lib/product-store";
import { getSettings } from "../../lib/settings-store";
import { applyDiscount, recordDiscountUse } from "../../lib/discount-store";

/** Orders belonging to the signed-in customer. */
export async function GET(request: NextRequest) {
  const claims = await readCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ orders: await ordersForCustomer(claims.sub) });
}

export async function POST(request: NextRequest) {
  let body: {
    items?: { id: string; quantity: number }[];
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    addressId?: string;
    note?: string;
    discountCode?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ error: "Your bag is empty" }, { status: 422 });

  const claims = await readCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
  const customer = claims ? await findById(claims.sub) : undefined;

  const contactName = (body.contactName ?? customer?.name ?? "").trim();
  const contactPhone = (body.contactPhone ?? customer?.phone ?? "").trim();
  if (!contactName) return NextResponse.json({ error: "Please give us a name for the order" }, { status: 422 });
  if (!contactPhone) return NextResponse.json({ error: "A contact phone number is required" }, { status: 422 });

  /*
   * Prices are taken from the catalogue, never from the request body — a
   * client-supplied price is a client-supplied discount.
   */
  const catalogue = await getProducts();
  const lines: OrderLine[] = [];
  for (const item of items) {
    const product = catalogue.find((entry) => entry.id === item.id);
    if (!product) continue;
    const quantity = Math.max(1, Math.min(99, Math.round(Number(item.quantity) || 1)));
    lines.push({
      productId: product.id,
      name: product.name,
      brand: product.brand,
      image: product.image,
      quantity,
      unitPriceLKR: product.priceLKR,
      lineTotalLKR: product.priceLKR * quantity,
    });
  }

  if (lines.length === 0) {
    return NextResponse.json({ error: "None of those products are still available" }, { status: 422 });
  }

  const subtotal = lines.reduce((total, line) => total + line.lineTotalLKR, 0);
  const settings = await getSettings();

  // Discount rules are resolved server-side; an invalid or ineligible code is
  // simply worth nothing rather than failing the whole order.
  const requested = (body.discountCode ?? "").trim();
  let discount = 0;
  let appliedCode: string | undefined;
  if (requested) {
    const result = await applyDiscount(requested, subtotal);
    if ("discount" in result) {
      discount = result.discount.amountLKR;
      appliedCode = result.discount.code;
    }
  }

  const shipping = subtotal >= settings.freeShippingThresholdLKR ? 0 : settings.flatShippingLKR;

  const address = customer?.addresses.find((entry) => entry.id === body.addressId) ??
    customer?.addresses.find((entry) => entry.isDefault);

  try {
    const order = await createOrder({
      customerId: customer?.id,
      contactName,
      contactPhone,
      contactEmail: body.contactEmail?.trim() || customer?.email,
      lines,
      subtotalLKR: subtotal,
      discountLKR: discount,
      shippingLKR: shipping,
      totalLKR: subtotal - discount + shipping,
      discountCode: appliedCode,
      address,
      note: body.note?.trim() || undefined,
    });

    // Only count a redemption once the order actually exists.
    if (appliedCode) await recordDiscountUse(appliedCode);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException)?.code;
    const message =
      errno === "EROFS" || errno === "EACCES" || errno === "EPERM"
        ? "Orders need a writable database on this host."
        : "Could not place the order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
