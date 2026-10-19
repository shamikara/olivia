import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPaymentConfig } from "../../../../lib/payments";
import { verifyReturn } from "../../../../lib/payments/mintpay";
import { findOrderByReference, settlePayment } from "../../../../lib/order-store";
import { notifyPaymentSettled } from "../../../../lib/order-notifications";
import { siteOrigin } from "../../../../lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Where Mintpay sends the shopper back to, and the only signal they give us.
 *
 * The `hash` is an HMAC we generated ourselves and handed to Mintpay when the
 * purchase was opened — see the warning in lib/payments/mintpay.ts. It proves
 * the URL was not tampered with; it does not prove Mintpay approved anything.
 *
 * Two guards make that acceptable:
 *   - the hash is bound to this order's id AND its total, so it cannot be moved
 *     to another order or survive the total changing;
 *   - settlePayment refuses to touch an order that is already resolved, so
 *     replaying the URL later does nothing.
 */
export async function GET(request: NextRequest) {
  const origin = siteOrigin(request);
  const params = request.nextUrl.searchParams;
  const reference = (params.get("orderId") ?? "").trim();
  const hash = (params.get("hash") ?? "").trim();

  if (!reference) return NextResponse.redirect(`${origin}/cart`, 303);

  const order = await findOrderByReference(reference);
  if (!order) return NextResponse.redirect(`${origin}/cart`, 303);

  const config = await getPaymentConfig();
  const verified = verifyReturn(order, hash, config.mintpay);

  if (!verified) {
    console.warn("[mintpay] return rejected — hash did not match", reference);
    return NextResponse.redirect(`${origin}/order/${reference}?payment=unconfirmed`, 303);
  }

  if (order.paymentMethod !== "mintpay") {
    console.warn("[mintpay] return for an order not paid via Mintpay", reference);
    return NextResponse.redirect(`${origin}/order/${reference}`, 303);
  }

  const settled = await settlePayment(reference, {
    status: verified.status,
    evidence: verified.evidence,
  });
  if (settled) await notifyPaymentSettled(settled);

  return NextResponse.redirect(`${origin}/order/${reference}`, 303);
}
