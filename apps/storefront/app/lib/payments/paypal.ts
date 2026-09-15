import type { Order } from "../order-store";
import type { PaypalConfig } from "./config";
import { paypalReady } from "./config";
import { PaymentConfigError, type VerifiedPayment } from "./types";

/**
 * PayPal — regular card/balance checkout via PayPal's embedded Buttons (JS SDK).
 *
 * Unlike Koko and Mintpay there is no redirect: the browser renders PayPal's
 * own button, the shopper approves in a popup, and our server creates and
 * then captures the order around that approval using PayPal's REST API
 * (Orders v2, https://developer.paypal.com/docs/api/orders/v2/).
 *
 * PayPal does not settle in LKR (Sri Lankan Rupee is not in its supported
 * currencies list), so every order is created in USD instead, converted from
 * the order's LKR total at a live rate fetched at checkout time.
 */

const HOSTS = {
  test: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

/* PAYPAL_API_BASE overrides the host — see the note in koko.ts. */
const host = (config: PaypalConfig): string =>
  (process.env.PAYPAL_API_BASE ?? "").trim().replace(/\/+$/, "") ||
  (config.testMode ? HOSTS.test : HOSTS.live);

const SETTLEMENT_CURRENCY = "USD";

const FX_ENDPOINT = "https://open.er-api.com/v6/latest/LKR";
const FX_CACHE_MS = 5 * 60 * 1000;

let cachedRate: { usdPerLKR: number; at: number } | null = null;

/**
 * LKR -> USD, cached for a few minutes. A free, keyless rate source rather
 * than a paid one, because the amount only has to be fair, not exact to the
 * cent — PayPal's own currency conversion at the shopper's card issuer will
 * differ from this by a similar margin anyway.
 */
async function lkrToUsdRate(): Promise<number> {
  if (cachedRate && Date.now() - cachedRate.at < FX_CACHE_MS) return cachedRate.usdPerLKR;

  const response = await fetch(FX_ENDPOINT, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new PaymentConfigError("Could not fetch an exchange rate for PayPal");

  const body = (await response.json().catch(() => null)) as { rates?: Record<string, number> } | null;
  const rate = body?.rates?.USD;
  if (!rate) throw new PaymentConfigError("Exchange rate service did not return a USD rate");

  cachedRate = { usdPerLKR: rate, at: Date.now() };
  return rate;
}

export async function lkrToUsd(amountLKR: number): Promise<string> {
  const rate = await lkrToUsdRate();
  return (amountLKR * rate).toFixed(2);
}

function basicAuth(config: PaypalConfig): string {
  return Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
}

/** Client-credentials grant — good for a few hours, but never cached here: every call is one gateway round trip either way. */
async function getAccessToken(config: PaypalConfig): Promise<string> {
  const response = await fetch(`${host(config)}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth(config)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(15000),
  });

  const body = (await response.json().catch(() => null)) as { access_token?: string } | null;
  if (!response.ok || !body?.access_token) {
    throw new PaymentConfigError("Could not authenticate with PayPal");
  }
  return body.access_token;
}

export interface PaypalOrder {
  id: string;
}

/**
 * Creates a PayPal order for the shopper to approve. The amount comes from
 * our own order record, not the browser — the embedded button only ever gets
 * back the order id this returns, never a say in what it is for.
 */
export async function createPaypalOrder(order: Order, config: PaypalConfig): Promise<PaypalOrder> {
  if (!paypalReady(config)) throw new PaymentConfigError("PayPal is not configured");

  const token = await getAccessToken(config);
  const amount = await lkrToUsd(order.totalLKR);

  const response = await fetch(`${host(config)}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: order.reference,
          amount: { currency_code: SETTLEMENT_CURRENCY, value: amount },
        },
      ],
    }),
    signal: AbortSignal.timeout(15000),
  });

  const body = (await response.json().catch(() => null)) as { id?: string } | null;
  if (!response.ok || !body?.id) {
    throw new PaymentConfigError("PayPal would not open an order for this order");
  }
  return { id: body.id };
}

interface PaypalCaptureResponse {
  purchase_units?: {
    reference_id?: string;
    payments?: {
      captures?: { id?: string; status?: string }[];
    };
  }[];
}

/**
 * Captures a previously-approved order. `reference_id` was set by us, from
 * our own order, when the PayPal order was created — only someone holding our
 * client secret could have made a PayPal order carrying it, so checking it
 * here is what stops a shopper from submitting an unrelated PayPal order id
 * (theirs, for a smaller purchase elsewhere) and having it marked as payment
 * for this one.
 */
export async function capturePaypalOrder(
  paypalOrderId: string,
  order: Order,
  config: PaypalConfig,
): Promise<VerifiedPayment | null> {
  if (!paypalReady(config)) return null;

  const token = await getAccessToken(config);
  const response = await fetch(`${host(config)}/v2/checkout/orders/${paypalOrderId}/capture`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(15000),
  });

  const body = (await response.json().catch(() => null)) as PaypalCaptureResponse | null;
  if (!response.ok || !body) return null;

  const unit = body.purchase_units?.[0];
  if (unit?.reference_id !== order.reference) return null;

  const capture = unit.payments?.captures?.[0];
  if (!capture || capture.status !== "COMPLETED") return null;

  return {
    reference: order.reference,
    status: "paid",
    transactionId: capture.id,
    evidence: "order-view",
  };
}
