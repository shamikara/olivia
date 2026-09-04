import { createSign, createVerify, randomInt, timingSafeEqual } from "node:crypto";
import type { Order } from "../order-store";
import type { KokoConfig } from "./config";
import { kokoReady } from "./config";
import {
  PaymentConfigError,
  type GatewayRedirect,
  type GatewayUrls,
  type PaymentProvider,
  type VerifiedPayment,
} from "./types";

/**
 * Koko (paykoko.com) — Sri Lankan BNPL, 3 interest-free instalments.
 *
 * Contract derived from their GPL WooCommerce plugin,
 * `paykoko-bnpl-payment-gateway` 3.0.4 by dInnovation (Pvt) Ltd.
 *
 * Three moving parts:
 *   orderCreate  we form-POST a signed order; the shopper lands on Koko's page
 *   callback     Koko POSTs the outcome to `_responseUrl`, RSA-signed
 *   orderView    we ask Koko for the truth, signed the same way
 *
 * The callback is authoritative. The browser coming back to `_returnUrl` proves
 * nothing on its own, so that path calls orderView rather than trusting it.
 */

const HOSTS = {
  test: "https://qaapi.paykoko.com",
  live: "https://prodapi.paykoko.com",
};

/*
 * KOKO_API_BASE overrides the host. Koko may hand you a different sandbox at
 * onboarding, and it is what lets the integration be driven end to end against
 * a local stand-in rather than only being typechecked.
 */
const host = (config: KokoConfig): string =>
  (process.env.KOKO_API_BASE ?? "").trim().replace(/\/+$/, "") ||
  (config.testMode ? HOSTS.test : HOSTS.live);

const endpoint = (config: KokoConfig, path: string): string =>
  `${host(config)}/api/merchants/${path}`;

/** Koko rejects anything that is not exactly two decimal places. */
const money = (amountLKR: number): string => amountLKR.toFixed(2);

function sign(data: string, privateKey: string): string {
  const signer = createSign("RSA-SHA256");
  signer.update(data, "utf8");
  signer.end();
  return signer.sign(privateKey, "base64");
}

/**
 * The reference Koko knows the order by. Their plugin mixes in random digits,
 * which matters because a retried order must not collide with the abandoned
 * attempt that came before it.
 */
export function buildReference(merchantId: string, orderReference: string): string {
  return `${merchantId}${randomInt(100000, 1000000)}-${orderReference}`;
}

/**
 * The exact concatenation Koko signs over. Order is load-bearing: a field out
 * of place produces a well-formed signature that Koko will reject.
 */
function orderCreateData(parts: {
  merchantId: string;
  amount: string;
  currency: string;
  clientName: string;
  clientVersion: string;
  returnUrl: string;
  cancelUrl: string;
  orderId: string;
  reference: string;
  firstName: string;
  lastName: string;
  email: string;
  description: string;
  apiKey: string;
  responseUrl: string;
}): string {
  return (
    parts.merchantId +
    parts.amount +
    parts.currency +
    parts.clientName +
    parts.clientVersion +
    parts.returnUrl +
    parts.cancelUrl +
    parts.orderId +
    parts.reference +
    parts.firstName +
    parts.lastName +
    parts.email +
    parts.description +
    parts.apiKey +
    parts.responseUrl
  );
}

const splitName = (full: string): [string, string] => {
  const parts = full.trim().split(/\s+/);
  return parts.length > 1 ? [parts.slice(0, -1).join(" "), parts[parts.length - 1]] : [full.trim(), "-"];
};

export function createOrderRedirect(
  order: Order,
  config: KokoConfig,
  urls: GatewayUrls,
  reference: string,
): GatewayRedirect {
  if (!kokoReady(config)) throw new PaymentConfigError("Koko is not configured");

  const [firstName, lastName] = splitName(order.contactName);
  const description = order.lines.length > 1 ? `${order.lines.length} products` : "1 Product";
  const amount = money(order.totalLKR);

  const data = orderCreateData({
    merchantId: config.merchantId,
    amount,
    currency: "LKR",
    clientName: config.clientName,
    clientVersion: config.clientVersion,
    returnUrl: urls.returnUrl,
    cancelUrl: urls.cancelUrl,
    orderId: order.reference,
    reference,
    firstName,
    lastName,
    email: order.contactEmail ?? "",
    description,
    apiKey: config.apiKey,
    responseUrl: urls.responseUrl,
  });

  return {
    method: "POST",
    action: endpoint(config, "orderCreate"),
    fields: {
      _mId: config.merchantId,
      api_key: config.apiKey,
      _returnUrl: urls.returnUrl,
      _responseUrl: urls.responseUrl,
      _cancelUrl: urls.cancelUrl,
      _currency: "LKR",
      _amount: amount,
      _reference: reference,
      _pluginName: config.clientName,
      _pluginVersion: config.clientVersion,
      _orderId: order.reference,
      _firstName: firstName,
      _lastName: lastName,
      _email: order.contactEmail ?? "",
      _description: description,
      _mobileNo: order.contactPhone,
      dataString: data,
      signature: sign(data, config.privateKey),
    },
  };
}

const SUCCESS = ["SUCCESS", "APPROVED", "COMPLETED"];
const CANCELLED = ["CANCELLED", "CANCELED"];

function normaliseStatus(raw: string): "paid" | "failed" | "cancelled" {
  const status = raw.trim().toUpperCase();
  if (SUCCESS.includes(status)) return "paid";
  if (CANCELLED.includes(status)) return "cancelled";
  return "failed";
}

export interface KokoCallback {
  orderId?: string;
  trnId?: string;
  status?: string;
  signature?: string;
}

/**
 * Verifies a server callback. Koko signs `orderId + trnId + status` with their
 * private key, so anyone can forge the body but not the signature.
 *
 * Note what is NOT in that string: the amount. A valid signature therefore says
 * "this order reached this status", not "this much money moved" — the caller
 * still has to check the total against its own record before fulfilling.
 */
export function verifyCallback(body: KokoCallback, config: KokoConfig): VerifiedPayment | null {
  if (!body.orderId || !body.status || !body.signature) return null;
  if (!config.publicKey) return null;

  const signature = Buffer.from(body.signature, "base64");
  if (signature.length === 0) return null;

  const data = `${body.orderId}${body.trnId ?? ""}${body.status}`;
  const verifier = createVerify("RSA-SHA256");
  verifier.update(data, "utf8");
  verifier.end();

  let valid = false;
  try {
    valid = verifier.verify(config.publicKey, signature);
  } catch {
    // A malformed public key throws rather than returning false.
    return null;
  }
  if (!valid) return null;

  return {
    reference: body.orderId,
    status: normaliseStatus(body.status),
    transactionId: body.trnId,
    evidence: "signed-callback",
  };
}

/**
 * Asks Koko directly what happened to an order. This is how the browser-return
 * path is settled, and the reconciliation tool for anything that arrives late.
 */
export async function orderView(
  orderReference: string,
  config: KokoConfig,
): Promise<VerifiedPayment | null> {
  if (!kokoReady(config)) return null;

  const data =
    config.merchantId + config.clientName + config.clientVersion + orderReference + config.apiKey;

  const body = new URLSearchParams({
    _mId: config.merchantId,
    api_key: config.apiKey,
    _orderId: orderReference,
    _pluginName: config.clientName,
    _pluginVersion: config.clientVersion,
    signature: sign(data, config.privateKey),
  });

  let payload: { content?: { status?: string; orderId?: string; trnId?: string } };
  try {
    const response = await fetch(endpoint(config, "orderView"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return null;
    payload = await response.json();
  } catch {
    return null;
  }

  const status = payload.content?.status;
  if (!status) return null;

  // Guard against a response for a different order.
  const returned = payload.content?.orderId;
  if (returned !== undefined && String(returned) !== orderReference) return null;

  return {
    reference: orderReference,
    status: normaliseStatus(status),
    transactionId: payload.content?.trnId,
    evidence: "order-view",
  };
}

/** Constant-time compare, for values echoed back to us by a third party. */
export function sameValue(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function kokoProvider(config: KokoConfig): PaymentProvider {
  return {
    method: "koko",
    label: "Koko",
    blurb: "Split into 3 interest-free instalments. Approval takes about a minute.",
    isConfigured: config.enabled && kokoReady(config),
    testMode: config.testMode,
    async startCheckout(order, urls) {
      return createOrderRedirect(order, config, urls, buildReference(config.merchantId, order.reference));
    },
  };
}
