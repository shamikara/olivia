import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSettings, saveSettings, type StoreSettings } from "../../../lib/settings-store";
import { requireAdmin } from "../../../lib/admin-auth";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ settings: await getSettings() });
}

export async function PUT(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const text = (key: string) => (typeof body[key] === "string" ? (body[key] as string).trim() : undefined);
  const num = (key: string) => {
    const value = Number(body[key]);
    return Number.isFinite(value) && value >= 0 ? Math.round(value) : undefined;
  };

  // A WhatsApp number must be digits only, or prefilled order text is dropped.
  const phone = text("whatsappPhone")?.replace(/[^\d]/g, "");
  if (phone && (phone.length < 9 || phone.length > 15)) {
    return NextResponse.json(
      { error: "WhatsApp number must be 9–15 digits in international format, e.g. 94771234567" },
      { status: 422 },
    );
  }

  const patch: Partial<StoreSettings> = {
    storeName: text("storeName"),
    tagline: text("tagline"),
    supportEmail: text("supportEmail"),
    whatsappPhone: phone,
    whatsappLink: text("whatsappLink"),
    instagram: text("instagram"),
    tiktok: text("tiktok"),
    facebook: text("facebook"),
    freeShippingThresholdLKR: num("freeShippingThresholdLKR"),
    flatShippingLKR: num("flatShippingLKR"),
    installmentMonths: num("installmentMonths"),
    lowStockThreshold: num("lowStockThreshold"),
    announcements: Array.isArray(body.announcements)
      ? (body.announcements as unknown[]).map(String).map((s) => s.trim()).filter(Boolean)
      : undefined,
  };

  // Drop keys the form didn't send so they aren't overwritten with undefined.
  for (const key of Object.keys(patch) as (keyof StoreSettings)[]) {
    if (patch[key] === undefined) delete patch[key];
  }

  try {
    return NextResponse.json({ settings: await saveSettings(patch) });
  } catch {
    return NextResponse.json({ error: "Could not save settings — storage is read-only" }, { status: 500 });
  }
}
