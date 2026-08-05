import { NextResponse } from "next/server";
import { getSettings } from "../../lib/settings-store";

export const dynamic = "force-dynamic";

/**
 * The public slice of the store settings, for client components that need the
 * live values rather than the build-time constants in `lib/site`. Fields are
 * whitelisted one by one so an internal setting added later can't leak by
 * being spread into the response.
 */
export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({
    settings: {
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
