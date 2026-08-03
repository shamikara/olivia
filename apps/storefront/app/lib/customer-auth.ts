import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

export const CUSTOMER_COOKIE = "customer_token";
const KEY_LENGTH = 64;

/*
 * Customers are signed with their own secret, never the admin one. Sharing a
 * secret would mean a customer's token verifies against the admin guard, which
 * is the classic way this kind of feature opens a hole.
 */
function secretKey(): Uint8Array {
  const secret =
    process.env.CUSTOMER_JWT_SECRET || `${process.env.JWT_SECRET ?? "olivia-glow"}-customer-realm`;
  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = await scryptAsync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, "hex");
  // Constant-time compare so a wrong password can't be found by timing.
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export interface CustomerClaims {
  sub: string;
  email: string;
  name: string;
  role: "customer";
}

export async function signCustomerToken(claims: Omit<CustomerClaims, "role">): Promise<string> {
  return new SignJWT({ email: claims.email, name: claims.name, role: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function readCustomerToken(token: string | undefined): Promise<CustomerClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (payload.role !== "customer") return null;
    return payload as unknown as CustomerClaims;
  } catch {
    return null;
  }
}

/** Reads the signed-in customer from the request cookies, or null. */
export async function currentCustomer(): Promise<CustomerClaims | null> {
  const store = await cookies();
  return readCustomerToken(store.get(CUSTOMER_COOKIE)?.value);
}
