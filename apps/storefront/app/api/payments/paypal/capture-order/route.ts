import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPaymentConfig } from "../../../../lib/payments";
import { capturePaypalOrder } from "../../../../lib/payments/paypal";
import { findOrderByReference, settlePayment } from "../../../../lib/order-store";
import { notifyPaymentSettled } from "../../../../lib/order-notifications";
import { syncStockForOrder } from "../../../../lib/stock";

export const dynamic = "force-dynamic";

/**
 * Called by the embedded PayPal button's `onApprove` callback, once the
 * shopper has approved in PayPal's popup. This is what actually moves money,
 * so `orderID` is checked against the PayPal order id we ourselves opened for
 * this order (stored as `gatewayReference` by create-order) before capturing
 * it — a shopper submitting some other PayPal order id of theirs should not
 * be able to have it recorded as payment for this one.
 */
export async function POST(request: NextRequest) {
  let body: { reference?: string; orderID?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const reference = (body.reference ?? "").trim();
  const orderID = (body.orderID ?? "").trim();
  const order = reference ? await findOrderByReference(reference) : undefined;
  if (!order || !orderID) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (order.paymentMethod !== "paypal" || order.gatewayReference !== orderID) {
    return NextResponse.json({ error: "That PayPal order does not belong to this order" }, { status: 422 });
  }

  const config = await getPaymentConfig();
  const verified = await capturePaypalOrder(orderID, order, config.paypal);
  if (!verified) {
    return NextResponse.json({ error: "PayPal did not confirm this payment" }, { status: 502 });
  }

  const settled = await settlePayment(reference, {
    status: verified.status,
    transactionId: verified.transactionId,
    evidence: verified.evidence,
  });
  if (settled) {
    await syncStockForOrder(settled);
    await notifyPaymentSettled(settled);
  }

  return NextResponse.json({ order: settled ?? order });
}
