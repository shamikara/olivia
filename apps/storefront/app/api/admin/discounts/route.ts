import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteDiscount, listDiscounts, upsertDiscount } from "../../../lib/discount-store";
import { requireAdmin } from "../../../lib/admin-auth";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ discounts: await listDiscounts() });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const code = String(body.code ?? "").trim();
  if (!/^[A-Za-z0-9_-]{3,24}$/.test(code)) {
    return NextResponse.json({ error: "Code must be 3–24 letters, numbers, dashes or underscores" }, { status: 422 });
  }

  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = Number(body.value);
  if (!Number.isFinite(value) || value <= 0) {
    return NextResponse.json({ error: "Value must be greater than zero" }, { status: 422 });
  }
  if (type === "percent" && value > 90) {
    return NextResponse.json({ error: "A percentage discount above 90% is almost certainly a mistake" }, { status: 422 });
  }

  const discount = await upsertDiscount({
    code,
    type,
    value,
    minSpendLKR: Number(body.minSpendLKR) || 0,
    active: body.active !== false,
    usageLimit: body.usageLimit === null || body.usageLimit === "" ? null : Number(body.usageLimit) || null,
    expiresAt: typeof body.expiresAt === "string" && body.expiresAt ? body.expiresAt : null,
  });

  return NextResponse.json({ discount }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const code = new URL(request.url).searchParams.get("code");
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
  const removed = await deleteDiscount(code);
  if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
