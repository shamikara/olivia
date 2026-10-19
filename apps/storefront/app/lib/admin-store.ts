import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { UserRole } from "@olivia/auth";
import { db, unwrap } from "./db/client";
import { hashPassword, verifyPassword } from "./password";

/**
 * Administrator accounts and password resets.
 *
 * Replaces the single hardcoded admin the login route used to compare a
 * plaintext password against. Hashes are scrypt, identical to customers.
 */

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  mustChangePassword: boolean;
  disabled: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

const TABLE = "admin_users";
const COLUMNS = "id, email, name, role, must_change_password, disabled, last_login_at, created_at";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toAccount(row: any): AdminAccount {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: row.must_change_password,
    disabled: row.disabled,
    lastLoginAt: row.last_login_at ? new Date(row.last_login_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const normaliseEmail = (email: string) => email.trim().toLowerCase();

export async function findAdminById(id: string): Promise<AdminAccount | undefined> {
  const rows = unwrap(await db().from(TABLE).select(COLUMNS).eq("id", id).limit(1), "findAdminById");
  return rows.length > 0 ? toAccount(rows[0]) : undefined;
}

export async function findAdminByEmail(email: string): Promise<AdminAccount | undefined> {
  const rows = unwrap(
    await db().from(TABLE).select(COLUMNS).eq("email", normaliseEmail(email)).limit(1),
    "findAdminByEmail",
  );
  return rows.length > 0 ? toAccount(rows[0]) : undefined;
}

/**
 * Checks an email/password pair.
 *
 * Returns undefined for a wrong password, an unknown address and a disabled
 * account alike — the caller must not tell them apart, or the form becomes a
 * way to enumerate who has an account.
 */
export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminAccount | undefined> {
  const rows = unwrap(
    await db()
      .from(TABLE)
      .select(`${COLUMNS}, password_hash`)
      .eq("email", normaliseEmail(email))
      .limit(1),
    "authenticateAdmin",
  );
  if (rows.length === 0) return undefined;

  const row = rows[0] as any;
  if (row.disabled) return undefined;
  if (!(await verifyPassword(password, row.password_hash))) return undefined;

  return toAccount(row);
}

export async function recordAdminLogin(id: string): Promise<void> {
  unwrap(
    await db().from(TABLE).update({ last_login_at: new Date().toISOString() }).eq("id", id).select("id"),
    "recordAdminLogin",
  );
}

/** Sets a new password and clears the must-change flag. */
export async function setAdminPassword(id: string, password: string): Promise<void> {
  unwrap(
    await db()
      .from(TABLE)
      .update({ password_hash: await hashPassword(password), must_change_password: false })
      .eq("id", id)
      .select("id"),
    "setAdminPassword",
  );
}

/** Confirms the current password before allowing a change. */
export async function checkAdminPassword(id: string, password: string): Promise<boolean> {
  const rows = unwrap(
    await db().from(TABLE).select("password_hash").eq("id", id).limit(1),
    "checkAdminPassword",
  );
  if (rows.length === 0) return false;
  return verifyPassword(password, (rows[0] as any).password_hash);
}

/* ------------------------------------------------------------ resets */

const RESETS = "admin_password_resets";
const RESET_TTL_MINUTES = 60;

/** Only ever the hash of a token is stored — see migration 0004. */
const tokenHash = (token: string) => createHash("sha256").update(token).digest("hex");

/**
 * Issues a reset token. The plaintext is returned once, for the email, and is
 * not recoverable afterwards.
 */
export async function createPasswordReset(adminId: string): Promise<{ token: string; expiresAt: string }> {
  const token = `${randomUUID().replace(/-/g, "")}${randomBytes(16).toString("hex")}`;
  const expiresAt = new Date(Date.now() + RESET_TTL_MINUTES * 60_000).toISOString();

  unwrap(
    await db()
      .from(RESETS)
      .insert({ token_hash: tokenHash(token), admin_id: adminId, expires_at: expiresAt })
      .select("token_hash"),
    "createPasswordReset",
  );

  return { token, expiresAt };
}

/**
 * Redeems a reset token and sets the new password.
 *
 * The token is marked used in the same breath, so a link that reaches more
 * than one inbox — forwarded, or in a shared mailbox — still only works once.
 */
export async function consumePasswordReset(
  token: string,
  newPassword: string,
): Promise<AdminAccount | undefined> {
  const rows = unwrap(
    await db()
      .from(RESETS)
      .select("token_hash, admin_id, expires_at, used_at")
      .eq("token_hash", tokenHash(token))
      .limit(1),
    "consumePasswordReset",
  );
  if (rows.length === 0) return undefined;

  const reset = rows[0] as any;
  if (reset.used_at) return undefined;
  if (new Date(reset.expires_at).getTime() < Date.now()) return undefined;

  const claimed = unwrap(
    await db()
      .from(RESETS)
      .update({ used_at: new Date().toISOString() })
      .eq("token_hash", reset.token_hash)
      .is("used_at", null)
      .select("token_hash"),
    "consumePasswordReset (claim)",
  );
  // Lost the race against another redemption of the same token.
  if (claimed.length === 0) return undefined;

  await setAdminPassword(reset.admin_id, newPassword);
  return findAdminById(reset.admin_id);
}
