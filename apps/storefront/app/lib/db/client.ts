import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * The application database.
 *
 * Orders, customers, products, discounts and settings used to be JSON files
 * under `data/`. That works on a host with a writable disk and silently loses
 * every write on a serverless one, so they now live in Supabase Postgres —
 * the same project the media pipeline already uses, so one pair of
 * credentials configures both.
 *
 * Server-only: this uses the service-role key, which bypasses row-level
 * security. It must never be imported from a client component.
 */

const url = (process.env.SUPABASE_URL ?? "").trim();
const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? "").trim();

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    const missing = [
      !url && "SUPABASE_URL",
      !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);
    super(
      `Database is not configured — set ${missing.join(" and ")}. ` +
        `Orders, customers and settings cannot be read or written without it.`,
    );
    this.name = "DatabaseNotConfiguredError";
  }
}

let cached: SupabaseClient | null = null;

export const isDatabaseConfigured = (): boolean => Boolean(url && serviceRoleKey);

/**
 * Throws rather than degrading when unconfigured. An empty shop or a silently
 * dropped order is far more expensive to notice than a failed request, and on
 * a live site the error lands in the host's logs immediately.
 */
export function db(): SupabaseClient {
  if (!isDatabaseConfigured()) throw new DatabaseNotConfiguredError();
  if (cached) return cached;

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/**
 * Supabase returns `{ data, error }` rather than throwing. Every call site
 * wants the same thing — the data, or a failure loud enough to find in a log —
 * so unwrapping is centralised here with the operation named.
 */
export function unwrap<T>(
  result: { data: T | null; error: { message: string } | null },
  operation: string,
): T {
  if (result.error) throw new Error(`${operation} failed: ${result.error.message}`);
  if (result.data === null) throw new Error(`${operation} returned no data`);
  return result.data;
}
