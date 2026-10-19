import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Password hashing, shared by customer and admin accounts.
 *
 * scrypt with a per-password salt, stored as `salt:hash`. Lives on its own so
 * both account types provably use the same primitive — an admin password must
 * not end up weaker than a shopper's.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const KEY_LENGTH = 64;

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
