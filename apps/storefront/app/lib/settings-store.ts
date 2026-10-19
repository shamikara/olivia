import { DEFAULT_PAYMENTS, type PaymentConfig } from "./payments/config";
import { db, unwrap } from "./db/client";

const TABLE = "app_settings";
/** Single-row table: the settings file this replaced was one JSON object. */
const ROW_ID = 1;

export interface StoreSettings {
  storeName: string;
  tagline: string;
  supportEmail: string;
  /** International format, digits only — required for WhatsApp to prefill orders. */
  whatsappPhone: string;
  whatsappLink: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  freeShippingThresholdLKR: number;
  flatShippingLKR: number;
  installmentMonths: number;
  lowStockThreshold: number;
  announcements: string[];
  /** Gateway credentials. Secrets here are overridden by env vars at read time. */
  payments: PaymentConfig;
}

export const DEFAULT_SETTINGS: StoreSettings = {
  storeName: "Olivia Glow",
  tagline: "K-Beauty & Luxury Skincare",
  supportEmail: "hello@oliviaglow.lk",
  whatsappPhone: "",
  whatsappLink: "https://wa.me/message/RXH3PJIFMXAEP1",
  instagram: "https://www.instagram.com/oliviaglow.lk?utm_source=qr",
  tiktok: "https://www.tiktok.com/@oliviaglow41?_r=1&_t=ZS-98MOQHA4s9l",
  facebook: "https://www.facebook.com/share/1DB3Bx18WX/?mibextid=wwXIfr",
  freeShippingThresholdLKR: 15000,
  flatShippingLKR: 450,
  installmentMonths: 3,
  lowStockThreshold: 5,
  announcements: [
    "10% off your first order with code GLOW10",
    "Islandwide delivery · Cash on delivery available",
    "100% authentic K-Beauty, sourced direct",
    "Pay in 3 with Mintpay, Koko & Payzy",
    "Free skin consultation on WhatsApp",
  ],
  payments: DEFAULT_PAYMENTS,
};

/**
 * Merges stored settings over the defaults so a field added after the row was
 * written never arrives undefined. Payments needs its own pass: a shallow
 * spread would drop a gateway added after the fact.
 */
function withDefaults(stored: Partial<StoreSettings>): StoreSettings {
  return {
    ...DEFAULT_SETTINGS,
    ...stored,
    payments: {
      ...DEFAULT_PAYMENTS,
      ...(stored.payments ?? {}),
      koko: { ...DEFAULT_PAYMENTS.koko, ...(stored.payments?.koko ?? {}) },
      mintpay: { ...DEFAULT_PAYMENTS.mintpay, ...(stored.payments?.mintpay ?? {}) },
      paypal: { ...DEFAULT_PAYMENTS.paypal, ...(stored.payments?.paypal ?? {}) },
    },
  };
}

export async function getSettings(): Promise<StoreSettings> {
  const rows = unwrap(await db().from(TABLE).select("data").eq("id", ROW_ID).limit(1), "getSettings");
  if (rows.length === 0) return DEFAULT_SETTINGS;
  return withDefaults((rows[0].data ?? {}) as Partial<StoreSettings>);
}

export async function saveSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const next = { ...(await getSettings()), ...patch };
  unwrap(
    await db()
      .from(TABLE)
      .upsert({ id: ROW_ID, data: next, updated_at: new Date().toISOString() }, { onConflict: "id" })
      .select("id"),
    "saveSettings",
  );
  return next;
}

/** Builds a WhatsApp link that carries `message`, when a number is configured. */
export function whatsappUrl(settings: StoreSettings, message?: string): string {
  if (!message || !settings.whatsappPhone) return settings.whatsappLink;
  return `https://wa.me/${settings.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
