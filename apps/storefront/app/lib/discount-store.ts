import { promises as fs } from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "discounts.json");

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

const SEED: Discount[] = [
  {
    code: "GLOW10",
    type: "percent",
    value: 10,
    minSpendLKR: 0,
    active: true,
    usageCount: 0,
    usageLimit: null,
    expiresAt: null,
    createdAt: new Date().toISOString(),
  },
];

async function readAll(): Promise<Discount[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : SEED;
  } catch {
    return SEED;
  }
}

async function writeAll(discounts: Discount[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(discounts, null, 2), "utf8");
}

export const listDiscounts = readAll;

export async function upsertDiscount(input: Partial<Discount> & { code: string }): Promise<Discount> {
  const discounts = await readAll();
  const code = input.code.trim().toUpperCase();
  const existing = discounts.find((item) => item.code === code);

  const next: Discount = {
    code,
    type: input.type ?? existing?.type ?? "percent",
    value: Math.max(0, Number(input.value ?? existing?.value ?? 0)),
    minSpendLKR: Math.max(0, Number(input.minSpendLKR ?? existing?.minSpendLKR ?? 0)),
    active: input.active ?? existing?.active ?? true,
    usageCount: existing?.usageCount ?? 0,
    usageLimit: input.usageLimit ?? existing?.usageLimit ?? null,
    expiresAt: input.expiresAt ?? existing?.expiresAt ?? null,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };

  await writeAll(existing ? discounts.map((item) => (item.code === code ? next : item)) : [next, ...discounts]);
  return next;
}

export async function deleteDiscount(code: string): Promise<boolean> {
  const discounts = await readAll();
  const remaining = discounts.filter((item) => item.code !== code.trim().toUpperCase());
  if (remaining.length === discounts.length) return false;
  await writeAll(remaining);
  return true;
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

  const found = (await readAll()).find((item) => item.code === wanted);
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

/** Called once an order using the code is actually created. */
export async function recordDiscountUse(code: string): Promise<void> {
  const discounts = await readAll();
  const wanted = code.trim().toUpperCase();
  await writeAll(
    discounts.map((item) => (item.code === wanted ? { ...item, usageCount: item.usageCount + 1 } : item)),
  );
}
