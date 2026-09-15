import type { Order } from "../order-store";

/**
 * Payment providers.
 *
 * Koko and Mintpay are Sri Lankan BNPL: the shopper is redirected to the
 * provider, approves three interest-free instalments, and we are paid in full
 * up front. PayPal is a regular card/balance payment, approved inline via
 * PayPal's own embedded buttons rather than a redirect. None of the three
 * holds card details on our side — we never see them.
 *
 * The Koko and Mintpay contracts were derived from each provider's own GPL
 * WooCommerce plugin (paykoko-bnpl-payment-gateway 3.0.4, mintpay). They are
 * accurate to those plugins; confirm them against the integration pack the
 * provider sends you at onboarding before going live.
 */

export type PaymentMethod = "cod" | "whatsapp" | "koko" | "mintpay" | "paypal";

export type PaymentStatus =
  | "unpaid"
  | "pending"
  | "paid"
  | "failed"
  | "cancelled";

/**
 * How we came to believe an order was paid, strongest first. Recorded on the
 * order because the two gateways do not offer equally trustworthy evidence and
 * whoever is reconciling the books needs to know which they are looking at.
 */
export type PaymentEvidence =
  | "signed-callback"
  | "order-view"
  | "return-hash"
  | "manual";

export interface GatewayUrls {
  /** Where the shopper's browser comes back to. */
  returnUrl: string;
  /** Server-to-server callback. Koko only. */
  responseUrl: string;
  /** Where the shopper lands if they back out at the gateway. */
  cancelUrl: string;
}

/**
 * A gateway hand-off. Both providers take a form POST rather than a plain
 * redirect, so the browser has to submit these fields to `action` itself.
 */
export interface GatewayRedirect {
  method: "POST";
  action: string;
  fields: Record<string, string>;
}

export interface VerifiedPayment {
  reference: string;
  status: "paid" | "failed" | "cancelled";
  transactionId?: string;
  evidence: PaymentEvidence;
}

export interface PaymentProvider {
  method: PaymentMethod;
  label: string;
  /** Shown under the option at checkout. */
  blurb: string;
  /** False when credentials are missing — the option is then hidden entirely. */
  isConfigured: boolean;
  testMode: boolean;
  startCheckout(order: Order, urls: GatewayUrls): Promise<GatewayRedirect>;
}

export class PaymentConfigError extends Error {}
