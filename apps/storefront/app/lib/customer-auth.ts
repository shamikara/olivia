import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const CUSTOMER_COOKIE = "customer_token";

/*
 * Re-exported so existing callers keep importing these from here. The
 * implementation moved to lib/password.ts once admin accounts needed the
 * same hashing.
 */
export { hashPassword, verifyPassword } from "./password";

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
