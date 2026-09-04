import { createHmac, timingSafeEqual } from "node:crypto";
import type { Order } from "../order-store";
import type { MintpayConfig } from "./config";
import { mintpayReady } from "./config";
import {
  PaymentConfigError,
  type GatewayRedirect,
  type GatewayUrls,
  type PaymentProvider,
  type VerifiedPayment,
} from "./types";

/**
 * Mintpay (mintpay.lk) — Sri Lankan BNPL, 3 instalments or instant cashback.
 *
 * Contract derived from their GPL WooCommerce plugin. Two steps: a JSON POST
 * that exchanges the order for a `purchase_id`, then a form POST that sends the
 * shopper to Mintpay's login carrying that id.
 *
 * A WARNING WORTH READING BEFORE YOU GO LIVE
 *
 * Mintpay has no server-to-server callback. The only signal that a payment
 * succeeded is the shopper's browser arriving at a `success_url` that WE built
 * and handed to Mintpay up front, carrying an HMAC WE generated. Mintpay does
 * not sign anything.
 *
 * That means the "proof" is self-issued and replayable: the same URL keeps
 * working forever, so a shopper who bookmarks it after one genuine purchase can
 * return to it. Forging one for a *different* order still needs the merchant
 * secret, so this is not wide open — but it is materially weaker than Koko's
 * signed callback, and it cannot tell you that money actually moved.
 *
 * Two things follow, both implemented by the callers of this module:
 *   1. Replay is refused — an order already resolved is never re-marked.
 *   2. Payments verified this way are recorded with `evidence: "return-hash"`
 *      so whoever reconciles the books can see which orders rest on it.
 *
 * Ask Mintpay for a server-to-server confirmation or an order-status endpoint
 * during onboarding. If they have one, it belongs here.
 */

const HOSTS = {
  test: "https://dev.mintpay.lk",
  live: "https://app.mintpay.lk",
};

/* MINTPAY_API_BASE overrides the host — see the note in koko.ts. */
const host = (config: MintpayConfig): string =>
  (process.env.MINTPAY_API_BASE ?? "").trim().replace(/\/+$/, "") ||
  (config.testMode ? HOSTS.test : HOSTS.live);

const money = (amountLKR: number): string => amountLKR.toFixed(2);

function hmac(data: string, secret: string): string {
  return createHmac("sha256", secret).update(data, "utf8").digest("hex");
}

/** Mintpay echoes these back on the redirect; they are our own HMACs. */
export function successHash(order: Order, config: MintpayConfig): string {
  return hmac(config.merchantId + money(order.totalLKR) + order.reference, config.merchantSecret);
}

export function failHash(order: Order, config: MintpayConfig): string {
  return hmac(order.reference, config.merchantSecret);
}

export function encodeHash(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

interface MintpayProduct {
  name: string;
  product_id: string;
  sku: string;
  quantity: number;
  unit_price: number;
  created_date: string;
  updated_date: string;
  discount: string;
}

/**
 * Exchanges the order for a purchase id. Network-bound, unlike Koko's
 * orderCreate which the browser posts directly.
 */
export async function createPurchase(
  order: Order,
  config: MintpayConfig,
  urls: GatewayUrls,
  customerIp?: string,
): Promise<GatewayRedirect> {
  if (!mintpayReady(config)) throw new PaymentConfigError("Mintpay is not configured");

  const stamp = order.createdAt.replace("T", " ").slice(0, 19);
  const products: MintpayProduct[] = order.lines.map((line) => ({
    name: line.name,
    product_id: line.productId,
    sku: line.productId,
    quantity: line.quantity,
    unit_price: line.unitPriceLKR,
    created_date: stamp,
    updated_date: stamp,
    discount: "0.00",
  }));

  const withHash = (base: string, hash: string): string => {
    const url = new URL(base);
    url.searchParams.set("orderId", order.reference);
    url.searchParams.set("hash", encodeHash(hash));
    return url.toString();
  };

  const payload = {
    merchant_id: config.merchantId,
    order_id: order.reference,
    total_price: money(order.totalLKR),
    discount: money(order.discountLKR),
    customer_id: order.customerId ?? "",
    customer_email: order.contactEmail ?? "",
    customer_telephone: order.contactPhone,
    ip: customerIp ?? "",
    x_forwarded_for: customerIp ?? "",
    delivery_street: [order.address?.line1, order.address?.line2].filter(Boolean).join(" "),
    delivery_region: order.address?.city ?? "",
    delivery_postcode: order.address?.postalCode ?? "",
    cart_created_date: stamp,
    cart_updated_date: stamp,
    success_url: withHash(urls.returnUrl, successHash(order, config)),
    fail_url: withHash(urls.returnUrl, failHash(order, config)),
    products,
    currency_code: "LKR",
    currency_symbol: "Rs.",
  };

  const response = await fetch(`${host(config)}/user-order/api/`, {
    method: "POST",
    headers: {
      Authorization: `Token ${config.merchantSecret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000),
  });

  const body = (await response.json().catch(() => null)) as
    | { message?: string; data?: string }
    | null;

  if (!response.ok || body?.message !== "Success" || !body.data) {
    throw new PaymentConfigError("Mintpay would not open a payment for this order");
  }

  return {
    method: "POST",
    action: `${host(config)}/user-order/login/`,
    fields: { purchase_id: String(body.data) },
  };
}

const constantTimeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

/**
 * Reads the outcome off the browser return. Returns null when the hash matches
 * neither the success nor the failure value — which means someone has been
 * editing the URL, and the order should be left alone.
 */
export function verifyReturn(
  order: Order,
  encoded: string,
  config: MintpayConfig,
): VerifiedPayment | null {
  if (!encoded || !mintpayReady(config)) return null;

  const received = Buffer.from(encoded, "base64").toString("utf8");
  if (!received) return null;

  if (constantTimeEqual(received, successHash(order, config))) {
    return { reference: order.reference, status: "paid", evidence: "return-hash" };
  }
  if (constantTimeEqual(received, failHash(order, config))) {
    return { reference: order.reference, status: "failed", evidence: "return-hash" };
  }
  return null;
}

export function mintpayProvider(config: MintpayConfig, customerIp?: string): PaymentProvider {
  return {
    method: "mintpay",
    label: "Mintpay",
    blurb: "Pay in 3 instalments, or take instant cashback instead.",
    isConfigured: config.enabled && mintpayReady(config),
    testMode: config.testMode,
    async startCheckout(order, urls) {
      return createPurchase(order, config, urls, customerIp);
    },
  };
}
