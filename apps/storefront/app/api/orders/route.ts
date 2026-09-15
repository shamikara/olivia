import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import {
  createOrder,
  markPaymentPending,
  ordersForCustomer,
  type OrderLine,
} from "../../lib/order-store";
import type { Address } from "../../lib/customer-store";
import { findById } from "../../lib/customer-store";
import { CUSTOMER_COOKIE, readCustomerToken } from "../../lib/customer-auth";
import { getProducts } from "../../lib/product-store";
import { getSettings } from "../../lib/settings-store";
import { applyDiscount, recordDiscountUse } from "../../lib/discount-store";
import { gatewayFor, isEmbeddedMethod, isGatewayMethod, type PaymentMethod } from "../../lib/payments";
import { withKokoSurcharge } from "../../lib/payments/surcharge";
import { siteOrigin } from "../../lib/site-url";

/** Orders belonging to the signed-in customer. */
export async function GET(request: NextRequest) {
  const claims = await readCustomerToken(request.cookies.get(CUSTOMER_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return NextResponse.json({ orders: await ordersForCustomer(claims.sub) });
}

const METHODS: PaymentMethod[] = ["cod", "whatsapp", "koko", "mintpay", "paypal"];

const text = (value: unknown, max = 200): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** An address typed at checkout by someone without an account. */
function guestAddress(input: Record<string, unknown> | undefined): Address | undefined {
  if (!input) return undefined;
  const line1 = text(input.line1);
  const city = text(input.city, 80);
  if (!line1 || !city) return undefined;
  return {
    id: `adr_${randomUUID().slice(0, 12)}`,
    label: text(input.label, 40) || "Delivery",
    fullName: text(input.fullName, 120),
    phone: text(input.phone, 32),
    line1,
    line2: text(input.line2) || undefined,
    city,
    district: text(input.district, 80) || undefined,
    postalCode: text(input.postalCode, 20) || undefined,
    isDefault: false,
  };
}

export async function POST(request: NextRequest) {
  let body: {
    items?: { id: string; quantity: number }[];
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    addressId?: string;
    address?: Record<string, unknown>;
    note?: string;
    discountCode?: string;
    paymentMethod?: string;
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
   * Unrecognised methods fall back to the WhatsApp hand-off rather than erroring
   * — the shopper has already told us what they want to buy, and losing that to
   * a validation failure is the worst outcome available.
   */
  const paymentMethod: PaymentMethod = METHODS.includes(body.paymentMethod as PaymentMethod)
    ? (body.paymentMethod as PaymentMethod)
    : "whatsapp";

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

  // Koko's cut on top of everything else — see withKokoSurcharge.
  const preSurchargeTotal = subtotal - discount + shipping;
  const total = paymentMethod === "koko" ? withKokoSurcharge(preSurchargeTotal) : preSurchargeTotal;

  const address =
    customer?.addresses.find((entry) => entry.id === body.addressId) ??
    guestAddress(body.address) ??
    customer?.addresses.find((entry) => entry.isDefault);

  // A gateway needs somewhere to deliver its customer to; without an address
  // the courier has nowhere to go either.
  if ((isGatewayMethod(paymentMethod) || isEmbeddedMethod(paymentMethod)) && !address) {
    return NextResponse.json({ error: "A delivery address is required" }, { status: 422 });
  }

  let order;
  try {
    order = await createOrder({
      customerId: customer?.id,
      contactName,
      contactPhone,
      contactEmail: body.contactEmail?.trim() || customer?.email,
      lines,
      subtotalLKR: subtotal,
      discountLKR: discount,
      shippingLKR: shipping,
      totalLKR: total,
      discountCode: appliedCode,
      address,
      note: body.note?.trim() || undefined,
      paymentMethod,
      // PayPal settles through its own embedded flow right after this
      // response, not the unpaid state cash-on-delivery/WhatsApp sit in.
      paymentStatus: paymentMethod === "paypal" ? "pending" : undefined,
    });
  } catch (error) {
    const errno = (error as NodeJS.ErrnoException)?.code;
    const message =
      errno === "EROFS" || errno === "EACCES" || errno === "EPERM"
        ? "Orders need a writable database on this host."
        : "Could not place the order";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Only count a redemption once the order actually exists.
  if (appliedCode) await recordDiscountUse(appliedCode);

  if (!isGatewayMethod(paymentMethod)) {
    return NextResponse.json({ order }, { status: 201 });
  }

  /*
   * The gateway hand-off is built here, server-side, because it carries a
   * signature over the amount. Anything the browser could assemble itself would
   * be a discount waiting to happen.
   */
  const gateway = await gatewayFor(
    paymentMethod,
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
  );
  if (!gateway) {
    return NextResponse.json(
      { order, error: `${paymentMethod} is not available right now`, fallback: true },
      { status: 200 },
    );
  }

  const origin = siteOrigin(request);
  try {
    const redirect = await gateway.startCheckout(order, {
      returnUrl: `${origin}/api/payments/${paymentMethod}/return`,
      responseUrl: `${origin}/api/payments/${paymentMethod}/callback`,
      cancelUrl: `${origin}/checkout?cancelled=${order.reference}`,
    });
    // Return the stored order, not the pre-handoff snapshot — otherwise the
    // response says "unpaid" for a payment that is already in flight.
    const pending = await markPaymentPending(order.reference, redirect.fields._reference ?? order.reference);
    return NextResponse.json({ order: pending ?? order, redirect }, { status: 201 });
  } catch {
    // The order stands; the shopper is offered the fallback instead.
    return NextResponse.json(
      { order, error: "That payment method could not be started", fallback: true },
      { status: 200 },
    );
  }
}
