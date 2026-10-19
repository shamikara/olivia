import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPaymentConfig } from "../../../../lib/payments";
import { orderView } from "../../../../lib/payments/koko";
import { findOrderByReference, settlePayment } from "../../../../lib/order-store";
import { notifyPaymentSettled } from "../../../../lib/order-notifications";
import { siteOrigin } from "../../../../lib/site-url";

export const dynamic = "force-dynamic";

/**
 * Where Koko sends the shopper's browser back to.
 *
 * Nothing in this request is trusted. The query string is attacker-controlled —
 * it is a URL in someone's address bar — so the outcome is established by
 * calling Koko's orderView API and asking them directly. The signed callback
 * usually beats the shopper back here anyway; this exists for when it does not.
 */

async function resolve(request: NextRequest, reference: string): Promise<NextResponse> {
  const origin = siteOrigin(request);
  if (!reference) return NextResponse.redirect(`${origin}/cart`, 303);

  const order = await findOrderByReference(reference);
  if (!order) return NextResponse.redirect(`${origin}/cart`, 303);

  // The callback may already have settled this, in which case leave it alone.
  if (order.paymentStatus === "unpaid" || order.paymentStatus === "pending") {
    const config = await getPaymentConfig();
    const verified = await orderView(reference, config.koko);
    if (verified) {
      const settled = await settlePayment(reference, {
        status: verified.status,
        transactionId: verified.transactionId,
        evidence: verified.evidence,
      });
      if (settled) await notifyPaymentSettled(settled);
    }
  }

  return NextResponse.redirect(`${origin}/order/${reference}`, 303);
}

const reference = (value: FormDataEntryValue | string | null): string =>
  typeof value === "string" ? value.trim() : "";

export async function GET(request: NextRequest) {
  return resolve(request, reference(request.nextUrl.searchParams.get("orderId")));
}

export async function POST(request: NextRequest) {
  let id = "";
  try {
    const form = await request.formData();
    id = reference(form.get("orderId"));
  } catch {
    id = reference(request.nextUrl.searchParams.get("orderId"));
  }
  return resolve(request, id);
}
