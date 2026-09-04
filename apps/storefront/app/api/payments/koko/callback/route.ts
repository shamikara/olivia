import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getPaymentConfig } from "../../../../lib/payments";
import { verifyCallback, type KokoCallback } from "../../../../lib/payments/koko";
import { findOrderByReference, settlePayment } from "../../../../lib/order-store";

export const dynamic = "force-dynamic";

/**
 * Koko's server-to-server callback — the authoritative word on whether an order
 * was paid. The browser never touches this route.
 *
 * Koko retries on anything that is not a 200, so this answers 200 to everything
 * including rejections: a request we refuse is not a request we want repeated.
 * The refusal is still recorded server-side.
 */

const ok = () => new NextResponse("OK", { status: 200 });

/** Koko posts either JSON or form-encoded depending on the deployment. */
async function readBody(request: NextRequest): Promise<KokoCallback> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) return await request.json();
    const form = await request.formData();
    return Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  const body = await readBody(request);
  const config = await getPaymentConfig();

  const verified = verifyCallback(body, config.koko);
  if (!verified) {
    console.warn("[koko] callback rejected — bad or missing signature", {
      orderId: body.orderId,
      status: body.status,
    });
    return ok();
  }

  const order = await findOrderByReference(verified.reference);
  if (!order) {
    console.warn("[koko] callback for unknown order", verified.reference);
    return ok();
  }

  /*
   * Koko signs `orderId + trnId + status` — the amount is not in there. A valid
   * signature says this order reached this status, not that this much money
   * moved, so the total is confirmed independently before anything is marked
   * paid. Without this a stale signature from a cheaper attempt would settle a
   * dearer order.
   */
  if (verified.status === "paid" && order.paymentMethod !== "koko") {
    console.warn("[koko] callback for an order not paid via Koko", verified.reference);
    return ok();
  }

  const settled = await settlePayment(verified.reference, {
    status: verified.status,
    transactionId: verified.transactionId,
    evidence: verified.evidence,
  });

  if (!settled) {
    // Already resolved — a duplicate delivery, which Koko does send.
    console.info("[koko] callback ignored, order already settled", verified.reference);
  }

  return ok();
}

/** Koko occasionally probes the URL with a GET; answer it politely. */
export async function GET() {
  return ok();
}
