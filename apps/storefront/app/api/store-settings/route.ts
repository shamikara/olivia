import { NextResponse } from "next/server";
import { getSettings } from "../../lib/settings-store";
import { paymentOptions } from "../../lib/payments";

export const dynamic = "force-dynamic";

/**
 * The public slice of the store settings, for client components that need the
 * live values rather than the build-time constants in `lib/site`. Fields are
 * whitelisted one by one so an internal setting added later can't leak by
 * being spread into the response.
 */
export async function GET() {
  const settings = await getSettings();

  /*
   * Which instalment providers the storefront may advertise. Derived from the
   * same function checkout uses, so a badge cannot outlive the gateway it
   * names — advertising a plan the shop cannot accept is worse than showing
   * no badge at all.
   */
  const instalmentProviders = (await paymentOptions())
    .filter((option) => option.instalments)
    .map((option) => option.label);

  return NextResponse.json({
    settings: {
      instalmentProviders,
      storeName: settings.storeName,
      supportEmail: settings.supportEmail,
      whatsappPhone: settings.whatsappPhone,
      whatsappLink: settings.whatsappLink,
      freeShippingThresholdLKR: settings.freeShippingThresholdLKR,
      flatShippingLKR: settings.flatShippingLKR,
      installmentMonths: settings.installmentMonths,
    },
  });
}
