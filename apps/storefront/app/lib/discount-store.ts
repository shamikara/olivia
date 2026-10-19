import { db, unwrap } from "./db/client";

export interface Discount {
  code: string;
  type: "percent" | "fixed";
  value: number;
  minSpendLKR: number;
  active: boolean;
  usageCount: number;
  usageLimit: number | null;
  expiresAt: string | null;
  createdAt: string;
}

const TABLE = "discounts";
const COLUMNS = "code, type, value, min_spend_lkr, active, usage_count, usage_limit, expires_at, created_at";

const SEED: Omit<Discount, "createdAt">[] = [
  {
    code: "GLOW10",
    type: "percent",
    value: 10,
    minSpendLKR: 0,
    active: true,
    usageCount: 0,
    usageLimit: null,
    expiresAt: null,
  },
];

/* eslint-disable @typescript-eslint/no-explicit-any */
function toDiscount(row: any): Discount {
  return {
    code: row.code,
    type: row.type,
    // `value` and `min_spend_lkr` are numeric columns; coerce rather than
    // trusting the driver to hand back a JS number.
    value: Number(row.value),
    minSpendLKR: Number(row.min_spend_lkr),
    active: row.active,
    usageCount: row.usage_count,
    usageLimit: row.usage_limit ?? null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function listDiscounts(): Promise<Discount[]> {
  const rows = unwrap(
    await db().from(TABLE).select(COLUMNS).order("created_at", { ascending: false }),
    "listDiscounts",
  );
  if (rows.length > 0) return rows.map(toDiscount);

  // First run against an empty database: plant the launch code the site
  // already advertises in its announcement bar.
  const seeded = unwrap(
    await db()
      .from(TABLE)
      .insert(
        SEED.map((item) => ({
          code: item.code,
          type: item.type,
          value: item.value,
          min_spend_lkr: item.minSpendLKR,
          active: item.active,
          usage_limit: item.usageLimit,
          expires_at: item.expiresAt,
        })),
      )
      .select(COLUMNS),
    "listDiscounts (seed)",
  );
  return seeded.map(toDiscount);
}

export async function upsertDiscount(input: Partial<Discount> & { code: string }): Promise<Discount> {
  const code = input.code.trim().toUpperCase();
  const existing = (await listDiscounts()).find((item) => item.code === code);

  const next = {
    code,
    type: input.type ?? existing?.type ?? "percent",
    value: Math.max(0, Number(input.value ?? existing?.value ?? 0)),
    min_spend_lkr: Math.max(0, Number(input.minSpendLKR ?? existing?.minSpendLKR ?? 0)),
    active: input.active ?? existing?.active ?? true,
    usage_limit: input.usageLimit ?? existing?.usageLimit ?? null,
    expires_at: input.expiresAt ?? existing?.expiresAt ?? null,
  };

  // usage_count is deliberately not sent: it belongs to the redemption
  // counter, and editing a code must not reset how many times it was used.
  const row = await db().from(TABLE).upsert(next, { onConflict: "code" }).select(COLUMNS).single();
  return toDiscount(unwrap(row, "upsertDiscount"));
}

export async function deleteDiscount(code: string): Promise<boolean> {
  const rows = unwrap(
    await db().from(TABLE).delete().eq("code", code.trim().toUpperCase()).select("code"),
    "deleteDiscount",
  );
  return rows.length > 0;
}

export interface AppliedDiscount {
  code: string;
  amountLKR: number;
}

/**
 * Resolves a code against the current rules. Returns the reason it failed so
 * the shopper is told why rather than just "invalid".
 */
export async function applyDiscount(
  code: string,
  subtotalLKR: number,
): Promise<{ discount: AppliedDiscount } | { error: string }> {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return { error: "Enter a code" };

  const rows = unwrap(await db().from(TABLE).select(COLUMNS).eq("code", wanted).limit(1), "applyDiscount");
  const found = rows.length > 0 ? toDiscount(rows[0]) : undefined;

  if (!found || !found.active) return { error: "That code isn't valid" };
  if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) return { error: "That code has expired" };
  if (found.usageLimit !== null && found.usageCount >= found.usageLimit) {
    return { error: "That code has been fully redeemed" };
  }
  if (subtotalLKR < found.minSpendLKR) {
    return { error: `Spend LKR ${found.minSpendLKR.toLocaleString("en-US")} to use this code` };
  }

  const amount =
    found.type === "percent"
      ? Math.round((subtotalLKR * found.value) / 100)
      : Math.min(found.value, subtotalLKR);

  return { discount: { code: found.code, amountLKR: amount } };
}

/**
 * Called once an order using the code is actually created. Incremented in a
 * single statement (see migration 0002) so two checkouts redeeming the same
 * code at once both count.
 */
export async function recordDiscountUse(code: string): Promise<void> {
  const { error } = await db().rpc("increment_discount_usage", { p_code: code });
  if (error) throw new Error(`recordDiscountUse failed: ${error.message}`);
}
