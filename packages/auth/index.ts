import { SignJWT, jwtVerify } from "jose";

export type UserRole = "super_admin" | "admin" | "store_manager" | "inventory_manager" | "marketing_manager" | "customer_support" | "content_editor" | "customer";
export const hasRole = (role: UserRole, allowed: UserRole[]) => allowed.includes(role);

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface AdminJwtPayload {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
  [key: string]: unknown;
}

const DEFAULT_SECRET = "olivia-glow-jwt-secret-key-2026-luxury-platform";

function getSecretKey() {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export async function signAdminToken(user: AdminUser): Promise<string> {
  const secret = getSecretKey();
  return new SignJWT({
    email: user.email,
    name: user.name,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);
}

export async function verifyAdminToken(token: string): Promise<AdminJwtPayload | null> {
  try {
    const secret = getSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as AdminJwtPayload;
  } catch {
    return null;
  }
}

