import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPaymentConfig } from "../../../../lib/payments";
import { createPaypalOrder } from "../../../../lib/payments/paypal";
import { findOrderByReference, markPaymentPending } from "../../../../lib/order-store";

export const dynamic = "force-dynamic";

/**
 * Called by the embedded PayPal button's own `createOrder` callback, right
 * when the shopper clicks it. Nothing here is trusted input except which of
 * our own orders to open a PayPal order for — the amount comes from that
 * order's own stored total, never from the request body.
 */
export async function POST(request: NextRequest) {
  let body: { reference?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reference = (body.reference ?? "").trim();
  const order = reference ? await findOrderByReference(reference) : undefined;
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentMethod !== "paypal") {
    return NextResponse.json({ error: "This order is not paying with PayPal" }, { status: 422 });
  }
  if (order.paymentStatus === "paid" || order.paymentStatus === "cancelled") {
    return NextResponse.json({ error: "This order is already settled" }, { status: 422 });
  }

  const config = await getPaymentConfig();
  try {
    const paypalOrder = await createPaypalOrder(order, config.paypal);
    await markPaymentPending(order.reference, paypalOrder.id);
    return NextResponse.json({ id: paypalOrder.id });
  } catch {
    return NextResponse.json({ error: "PayPal could not be started for this order" }, { status: 502 });
  }
}
