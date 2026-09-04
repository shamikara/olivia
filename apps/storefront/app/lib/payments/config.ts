/**
 * Gateway credentials.
 *
 * Secrets are read from the environment first and the settings file second, so
 * production can keep them out of the data directory entirely while a local or
 * staging box stays configurable from the admin panel. `data/` is gitignored,
 * but an environment variable is still the safer home for a private key.
 *
 * This module deliberately does not import the settings store — the store
 * imports these defaults, and a cycle between them leaves DEFAULT_PAYMENTS
 * undefined at module-init time. Callers pass the stored block in.
 */

export interface KokoConfig {
  enabled: boolean;
  testMode: boolean;
  merchantId: string;
  apiKey: string;
  /** Koko's public key — verifies the callbacks they send us. */
  publicKey: string;
  /** Ours — signs the requests we send them. */
  privateKey: string;
  /**
   * Sent as `_pluginName`/`_pluginVersion`. Koko's own plugin sends
   * "woocommerce"; confirm at onboarding whether they whitelist this value.
   */
  clientName: string;
  clientVersion: string;
}

export interface MintpayConfig {
  enabled: boolean;
  testMode: boolean;
  merchantId: string;
  merchantSecret: string;
}

export interface PaymentConfig {
  codEnabled: boolean;
  whatsappEnabled: boolean;
  koko: KokoConfig;
  mintpay: MintpayConfig;
}

export const DEFAULT_PAYMENTS: PaymentConfig = {
  codEnabled: true,
  whatsappEnabled: true,
  koko: {
    enabled: false,
    testMode: true,
    merchantId: "",
    apiKey: "",
    publicKey: "",
    privateKey: "",
    clientName: "nextjs",
    clientVersion: "1.0",
  },
  mintpay: {
    enabled: false,
    testMode: true,
    merchantId: "",
    merchantSecret: "",
  },
};

const env = (name: string): string => (process.env[name] ?? "").trim();

/**
 * Newlines in a PEM survive most environment plumbing badly, so `\n` written
 * literally in a .env file is accepted and unescaped here.
 */
const pem = (value: string): string => value.replace(/\\n/g, "\n").trim();

/** Applies environment overrides over whatever the settings file holds. */
export function resolvePaymentConfig(stored: PaymentConfig = DEFAULT_PAYMENTS): PaymentConfig {
  return {
    codEnabled: stored.codEnabled,
    whatsappEnabled: stored.whatsappEnabled,
    koko: {
      ...stored.koko,
      merchantId: env("KOKO_MERCHANT_ID") || stored.koko.merchantId,
      apiKey: env("KOKO_API_KEY") || stored.koko.apiKey,
      publicKey: pem(env("KOKO_PUBLIC_KEY") || stored.koko.publicKey),
      privateKey: pem(env("KOKO_PRIVATE_KEY") || stored.koko.privateKey),
    },
    mintpay: {
      ...stored.mintpay,
      merchantId: env("MINTPAY_MERCHANT_ID") || stored.mintpay.merchantId,
      merchantSecret: env("MINTPAY_MERCHANT_SECRET") || stored.mintpay.merchantSecret,
    },
  };
}

export const kokoReady = (config: KokoConfig): boolean =>
  Boolean(config.merchantId && config.apiKey && config.publicKey && config.privateKey);

export const mintpayReady = (config: MintpayConfig): boolean =>
  Boolean(config.merchantId && config.merchantSecret);

/** Which values are coming from the environment, for the admin panel to show. */
export function secretSources(): Record<string, boolean> {
  return {
    kokoMerchantId: Boolean(env("KOKO_MERCHANT_ID")),
    kokoApiKey: Boolean(env("KOKO_API_KEY")),
    kokoPublicKey: Boolean(env("KOKO_PUBLIC_KEY")),
    kokoPrivateKey: Boolean(env("KOKO_PRIVATE_KEY")),
    mintpayMerchantId: Boolean(env("MINTPAY_MERCHANT_ID")),
    mintpayMerchantSecret: Boolean(env("MINTPAY_MERCHANT_SECRET")),
  };
}
