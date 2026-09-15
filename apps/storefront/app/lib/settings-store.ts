import { promises as fs } from "node:fs";
import path from "node:path";
import { DEFAULT_PAYMENTS, type PaymentConfig } from "./payments/config";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "settings.json");

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

export async function getSettings(): Promise<StoreSettings> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const stored = JSON.parse(raw) as Partial<StoreSettings>;
    // Merge over defaults so a new field never arrives undefined. Payments
    // needs its own pass: a shallow spread would drop a gateway added after
    // the file was written.
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
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(patch: Partial<StoreSettings>): Promise<StoreSettings> {
  const next = { ...(await getSettings()), ...patch };
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(next, null, 2), "utf8");
  return next;
}

/** Builds a WhatsApp link that carries `message`, when a number is configured. */
export function whatsappUrl(settings: StoreSettings, message?: string): string {
  if (!message || !settings.whatsappPhone) return settings.whatsappLink;
  return `https://wa.me/${settings.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
