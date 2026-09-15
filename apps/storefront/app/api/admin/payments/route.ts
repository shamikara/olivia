import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSettings, saveSettings } from "../../../lib/settings-store";
import { requireAdmin } from "../../../lib/admin-auth";
import {
  DEFAULT_PAYMENTS,
  kokoReady,
  mintpayReady,
  paypalReady,
  resolvePaymentConfig,
  secretSources,
  type PaymentConfig,
} from "../../../lib/payments/config";

export const dynamic = "force-dynamic";

/**
 * Gateway credentials.
 *
 * Secrets go in but never come back out: the response says whether each one is
 * set and where it came from, not what it is. An admin session is not a reason
 * to put a private key on the wire again once it has been stored.
 */

const mask = (value: string) => Boolean(value && value.length > 0);

async function present(): Promise<PaymentConfig> {
  return resolvePaymentConfig((await getSettings()).payments);
}

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const config = await present();
  return NextResponse.json({
    payments: {
      codEnabled: config.codEnabled,
      whatsappEnabled: config.whatsappEnabled,
      koko: {
        enabled: config.koko.enabled,
        testMode: config.koko.testMode,
        merchantId: config.koko.merchantId,
        clientName: config.koko.clientName,
        clientVersion: config.koko.clientVersion,
        apiKeySet: mask(config.koko.apiKey),
        publicKeySet: mask(config.koko.publicKey),
        privateKeySet: mask(config.koko.privateKey),
        ready: kokoReady(config.koko),
      },
      mintpay: {
        enabled: config.mintpay.enabled,
        testMode: config.mintpay.testMode,
        merchantId: config.mintpay.merchantId,
        merchantSecretSet: mask(config.mintpay.merchantSecret),
        ready: mintpayReady(config.mintpay),
      },
      paypal: {
        enabled: config.paypal.enabled,
        testMode: config.paypal.testMode,
        clientId: config.paypal.clientId,
        clientSecretSet: mask(config.paypal.clientSecret),
        ready: paypalReady(config.paypal),
      },
    },
    fromEnvironment: secretSources(),
  });
}

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const str = (value: unknown, max = 6000): string | undefined =>
  typeof value === "string" ? value.trim().slice(0, max) : undefined;

/** A blank secret means "leave the stored one alone", not "erase it". */
const keepOrReplace = (incoming: string | undefined, current: string): string =>
  incoming === undefined || incoming === "" ? current : incoming;

function looksLikePem(value: string, kind: "PUBLIC" | "PRIVATE"): boolean {
  if (!value) return true;
  return value.includes(`BEGIN ${kind} KEY`) || value.includes("BEGIN RSA PRIVATE KEY");
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: {
    koko?: Record<string, unknown>;
    mintpay?: Record<string, unknown>;
    paypal?: Record<string, unknown>;
  } & Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const stored = (await getSettings()).payments ?? DEFAULT_PAYMENTS;
  const koko = body.koko ?? {};
  const mintpay = body.mintpay ?? {};
  const paypal = body.paypal ?? {};

  const publicKey = keepOrReplace(str(koko.publicKey), stored.koko.publicKey);
  const privateKey = keepOrReplace(str(koko.privateKey), stored.koko.privateKey);

  // A key pasted without its armour will fail at signing time with a message
  // nobody can act on, so it is rejected here where the cause is obvious.
  if (!looksLikePem(publicKey, "PUBLIC")) {
    return NextResponse.json(
      { error: "Koko public key must be a PEM block beginning -----BEGIN PUBLIC KEY-----" },
      { status: 422 },
    );
  }
  if (!looksLikePem(privateKey, "PRIVATE")) {
    return NextResponse.json(
      { error: "Koko private key must be a PEM block beginning -----BEGIN PRIVATE KEY-----" },
      { status: 422 },
    );
  }

  const next: PaymentConfig = {
    codEnabled: bool(body.codEnabled, stored.codEnabled),
    whatsappEnabled: bool(body.whatsappEnabled, stored.whatsappEnabled),
    koko: {
      enabled: bool(koko.enabled, stored.koko.enabled),
      testMode: bool(koko.testMode, stored.koko.testMode),
      merchantId: str(koko.merchantId, 120) ?? stored.koko.merchantId,
      apiKey: keepOrReplace(str(koko.apiKey, 500), stored.koko.apiKey),
      publicKey,
      privateKey,
      clientName: str(koko.clientName, 40) || stored.koko.clientName,
      clientVersion: str(koko.clientVersion, 20) || stored.koko.clientVersion,
    },
    mintpay: {
      enabled: bool(mintpay.enabled, stored.mintpay.enabled),
      testMode: bool(mintpay.testMode, stored.mintpay.testMode),
      merchantId: str(mintpay.merchantId, 120) ?? stored.mintpay.merchantId,
      merchantSecret: keepOrReplace(str(mintpay.merchantSecret, 500), stored.mintpay.merchantSecret),
    },
    paypal: {
      enabled: bool(paypal.enabled, stored.paypal.enabled),
      testMode: bool(paypal.testMode, stored.paypal.testMode),
      clientId: str(paypal.clientId, 200) ?? stored.paypal.clientId,
      clientSecret: keepOrReplace(str(paypal.clientSecret, 500), stored.paypal.clientSecret),
    },
  };

  // Refuse to advertise a gateway that cannot complete a payment.
  const resolved = resolvePaymentConfig(next);
  if (next.koko.enabled && !kokoReady(resolved.koko)) {
    return NextResponse.json(
      { error: "Koko needs a merchant ID, API key, public key and private key before it can be enabled" },
      { status: 422 },
    );
  }
  if (next.mintpay.enabled && !mintpayReady(resolved.mintpay)) {
    return NextResponse.json(
      { error: "Mintpay needs a merchant ID and merchant secret before it can be enabled" },
      { status: 422 },
    );
  }
  if (next.paypal.enabled && !paypalReady(resolved.paypal)) {
    return NextResponse.json(
      { error: "PayPal needs a client ID and client secret before it can be enabled" },
      { status: 422 },
    );
  }
  if (
    !next.codEnabled &&
    !next.whatsappEnabled &&
    !next.koko.enabled &&
    !next.mintpay.enabled &&
    !next.paypal.enabled
  ) {
    return NextResponse.json(
      { error: "At least one payment method has to stay switched on" },
      { status: 422 },
    );
  }

  try {
    await saveSettings({ payments: next });
  } catch {
    return NextResponse.json({ error: "Could not save — storage is read-only" }, { status: 500 });
  }

  return GET(request);
}
