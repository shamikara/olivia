import { randomUUID } from "node:crypto";
import { db, unwrap } from "./db/client";

/**
 * Customer accounts and their saved addresses.
 *
 * Backed by the `customers` table (migration 0002). Passwords are only ever
 * stored as a scrypt hash — see customer-auth.ts. Addresses stay a jsonb
 * document rather than a child table: they are always read and written with
 * the customer, and nothing queries across them.
 */

export interface Address {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  district?: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
  addresses: Address[];
  /** Product ids, in the order they were saved. */
  wishlist: string[];
  createdAt: string;
}

/** Everything except the password hash — safe to send to the browser. */
export type PublicCustomer = Omit<Customer, "passwordHash">;

export const toPublic = ({ passwordHash: _passwordHash, ...rest }: Customer): PublicCustomer => rest;

const TABLE = "customers";
const COLUMNS = "id, email, name, phone, password_hash, addresses, wishlist, created_at";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toCustomer(row: any): Customer {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone ?? undefined,
    passwordHash: row.password_hash,
    addresses: (row.addresses ?? []) as Address[],
    wishlist: (row.wishlist ?? []) as string[],
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export async function findByEmail(email: string): Promise<Customer | undefined> {
  const rows = await db().from(TABLE).select(COLUMNS).eq("email", normaliseEmail(email)).limit(1);
  const found = unwrap(rows, "findByEmail");
  return found.length > 0 ? toCustomer(found[0]) : undefined;
}

/** Every customer, newest first. For the admin list, stats and CSV export. */
export async function allCustomers(): Promise<Customer[]> {
  const rows = unwrap(
    await db().from(TABLE).select(COLUMNS).order("created_at", { ascending: false }),
    "allCustomers",
  );
  return rows.map(toCustomer);
}

export async function findById(id: string): Promise<Customer | undefined> {
  const rows = await db().from(TABLE).select(COLUMNS).eq("id", id).limit(1);
  const found = unwrap(rows, "findById");
  return found.length > 0 ? toCustomer(found[0]) : undefined;
}

export async function createCustomer(input: {
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
}): Promise<Customer> {
  const row = await db()
    .from(TABLE)
    .insert({
      id: `cus_${randomUUID().slice(0, 12)}`,
      email: normaliseEmail(input.email),
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      password_hash: input.passwordHash,
      addresses: [],
      wishlist: [],
    })
    .select(COLUMNS)
    .single();

  return toCustomer(unwrap(row, "createCustomer"));
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, "name" | "phone" | "addresses" | "passwordHash" | "wishlist">>,
): Promise<Customer | undefined> {
  // Only the keys actually present are sent, so a patch of one field cannot
  // blank the others.
  const update: Record<string, unknown> = {};
  if (patch.name !== undefined) update.name = patch.name;
  if (patch.phone !== undefined) update.phone = patch.phone || null;
  if (patch.addresses !== undefined) update.addresses = patch.addresses;
  if (patch.wishlist !== undefined) update.wishlist = patch.wishlist;
  if (patch.passwordHash !== undefined) update.password_hash = patch.passwordHash;

  if (Object.keys(update).length === 0) return findById(id);

  const rows = await db().from(TABLE).update(update).eq("id", id).select(COLUMNS);
  const updated = unwrap(rows, "updateCustomer");
  return updated.length > 0 ? toCustomer(updated[0]) : undefined;
}

/** Adds or replaces an address, keeping exactly one default. */
export async function saveAddress(customerId: string, address: Omit<Address, "id"> & { id?: string }) {
  const customer = await findById(customerId);
  if (!customer) return undefined;

  const id = address.id ?? `adr_${randomUUID().slice(0, 8)}`;
  const next = { ...address, id } as Address;

  let addresses = customer.addresses.filter((existing) => existing.id !== id);
  addresses.push(next);

  // First address is always the default; otherwise honour the flag.
  if (next.isDefault || addresses.length === 1) {
    addresses = addresses.map((item) => ({ ...item, isDefault: item.id === id }));
  }

  return updateCustomer(customerId, { addresses });
}

export async function deleteAddress(customerId: string, addressId: string) {
  const customer = await findById(customerId);
  if (!customer) return undefined;

  let addresses = customer.addresses.filter((address) => address.id !== addressId);
  // Never leave a customer with addresses but no default.
  if (addresses.length > 0 && !addresses.some((address) => address.isDefault)) {
    addresses = addresses.map((address, index) => ({ ...address, isDefault: index === 0 }));
  }
  return updateCustomer(customerId, { addresses });
}
