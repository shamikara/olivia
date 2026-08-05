"use client";

import { useEffect, useState } from "react";
import { SITE } from "./site";

export interface PublicSettings {
  storeName: string;
  supportEmail: string;
  /** Digits only, international format. Empty means no prefilled messages. */
  whatsappPhone: string;
  whatsappLink: string;
  freeShippingThresholdLKR: number;
  flatShippingLKR: number;
  installmentMonths: number;
}

/*
 * The build-time constants are the fallback, not the source of truth — they are
 * what shows while the fetch is in flight, and what the storefront runs on if
 * the settings endpoint is unreachable.
 */
const FALLBACK: PublicSettings = {
  storeName: SITE.name,
  supportEmail: "hello@oliviaglow.lk",
  whatsappPhone: SITE.whatsappPhone,
  whatsappLink: SITE.whatsapp,
  freeShippingThresholdLKR: SITE.freeShippingThreshold,
  flatShippingLKR: 450,
  installmentMonths: SITE.installmentMonths,
};

/*
 * One request per page load, shared by every caller. The promise is cached
 * rather than the value so components mounting in the same tick queue up behind
 * a single fetch instead of racing.
 */
let inFlight: Promise<PublicSettings> | null = null;

function load(): Promise<PublicSettings> {
  inFlight ??= fetch("/api/store-settings")
    .then((res) => (res.ok ? res.json() : null))
    .then((data) => ({ ...FALLBACK, ...(data?.settings ?? {}) }))
    .catch(() => FALLBACK);
  return inFlight;
}

/** Live store settings, starting from the build-time defaults. */
export function usePublicSettings(enabled = true): PublicSettings {
  const [settings, setSettings] = useState<PublicSettings>(FALLBACK);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    load().then((next) => {
      if (active) setSettings(next);
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return settings;
}

/** Builds a WhatsApp link that actually carries `message`, when possible. */
export function whatsappHref(settings: PublicSettings, message?: string): string {
  if (!message || !settings.whatsappPhone) return settings.whatsappLink;
  return `https://wa.me/${settings.whatsappPhone}?text=${encodeURIComponent(message)}`;
}
