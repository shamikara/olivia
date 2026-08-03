import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Customer accounts and their saved addresses.
 *
 * Same storage seam as the product store: a JSON file today, swappable for a
 * database by replacing readAll/writeAll. Passwords are only ever stored as a
 * scrypt hash — see customer-auth.ts.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "customers.json");

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
  createdAt: string;
}

/** Everything except the password hash — safe to send to the browser. */
export type PublicCustomer = Omit<Customer, "passwordHash">;

export const toPublic = ({ passwordHash: _passwordHash, ...rest }: Customer): PublicCustomer => rest;

async function readAll(): Promise<Customer[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(customers: Customer[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(customers, null, 2), "utf8");
}

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export async function findByEmail(email: string): Promise<Customer | undefined> {
  const wanted = normaliseEmail(email);
  return (await readAll()).find((customer) => customer.email === wanted);
}

export async function findById(id: string): Promise<Customer | undefined> {
  return (await readAll()).find((customer) => customer.id === id);
}

export async function createCustomer(input: {
  email: string;
  name: string;
  phone?: string;
  passwordHash: string;
}): Promise<Customer> {
  const customers = await readAll();
  const customer: Customer = {
    id: `cus_${randomUUID().slice(0, 12)}`,
    email: normaliseEmail(input.email),
    name: input.name.trim(),
    phone: input.phone?.trim() || undefined,
    passwordHash: input.passwordHash,
    addresses: [],
    createdAt: new Date().toISOString(),
  };
  customers.push(customer);
  await writeAll(customers);
  return customer;
}

export async function updateCustomer(
  id: string,
  patch: Partial<Pick<Customer, "name" | "phone" | "addresses" | "passwordHash">>,
): Promise<Customer | undefined> {
  const customers = await readAll();
  const index = customers.findIndex((customer) => customer.id === id);
  if (index === -1) return undefined;
  customers[index] = { ...customers[index], ...patch };
  await writeAll(customers);
  return customers[index];
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
