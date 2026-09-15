import { getSettings } from "../settings-store";
import { kokoReady, paypalReady, resolvePaymentConfig, type PaymentConfig } from "./config";
import { kokoProvider } from "./koko";
import { mintpayProvider } from "./mintpay";
import type { PaymentMethod, PaymentProvider } from "./types";

export * from "./types";
export { kokoReady, mintpayReady, paypalReady, resolvePaymentConfig, secretSources } from "./config";
export type { KokoConfig, MintpayConfig, PaypalConfig, PaymentConfig } from "./config";

/** The gateway config with environment overrides applied. */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  return resolvePaymentConfig((await getSettings()).payments);
}

/** What the checkout page offers, in the order it should be listed. */
export interface PaymentOption {
  method: PaymentMethod;
  label: string;
  blurb: string;
  /** True while the gateway is pointed at its sandbox. */
  testMode: boolean;
  /** Instalments only — drives the "or 3 × …" line under the option. */
  instalments: boolean;
  /**
   * PayPal only — its client id is public by design, so the browser can load
   * PayPal's own Buttons SDK with it. Nothing secret ever reaches the client.
   */
  clientId?: string;
}

export async function paymentOptions(config?: PaymentConfig): Promise<PaymentOption[]> {
  const payments = config ?? (await getPaymentConfig());
  const options: PaymentOption[] = [];

  if (payments.koko.enabled && kokoReady(payments.koko)) {
    options.push({
      method: "koko",
      label: "Koko",
      blurb: "Split into 3 interest-free instalments. Approval takes about a minute.",
      testMode: payments.koko.testMode,
      instalments: true,
    });
  }

  // Mintpay disabled for now.
  // if (payments.mintpay.enabled && mintpayReady(payments.mintpay)) {
  //   options.push({
  //     method: "mintpay",
  //     label: "Mintpay",
  //     blurb: "Pay in 3 instalments, or take instant cashback instead.",
  //     testMode: payments.mintpay.testMode,
  //     instalments: true,
  //   });
  // }

  if (payments.codEnabled) {
    options.push({
      method: "cod",
      label: "Cash on delivery",
      blurb: "Pay the courier when it arrives. Available islandwide.",
      testMode: false,
      instalments: false,
    });
  }

  if (payments.whatsappEnabled) {
    options.push({
      method: "whatsapp",
      label: "Arrange on WhatsApp",
      blurb: "We confirm stock and delivery with you, then take payment however suits.",
      testMode: false,
      instalments: false,
    });
  }

  if (payments.paypal.enabled && paypalReady(payments.paypal)) {
    options.push({
      method: "paypal",
      label: "PayPal",
      blurb: "Pay securely with your PayPal balance or card.",
      testMode: payments.paypal.testMode,
      instalments: false,
      clientId: payments.paypal.clientId,
    });
  }

  return options;
}

/**
 * The provider that actually talks to a gateway. Only Koko and Mintpay have
 * one — cash on delivery and the WhatsApp hand-off never leave the site.
 * PayPal is embedded rather than a redirect, so it is handled by its own API
 * routes instead of through this form-post abstraction — see isEmbeddedMethod.
 */
export async function gatewayFor(
  method: PaymentMethod,
  customerIp?: string,
): Promise<PaymentProvider | null> {
  const payments = await getPaymentConfig();
  if (method === "koko") {
    const provider = kokoProvider(payments.koko);
    return provider.isConfigured ? provider : null;
  }
  if (method === "mintpay") {
    const provider = mintpayProvider(payments.mintpay, customerIp);
    return provider.isConfigured ? provider : null;
  }
  return null;
}

export const isGatewayMethod = (method: PaymentMethod): boolean =>
  method === "koko" || method === "mintpay";

/** PayPal settles via its embedded buttons, not a server-built redirect — but still needs an address and a pending order the same way a gateway does. */
export const isEmbeddedMethod = (method: PaymentMethod): boolean => method === "paypal";
