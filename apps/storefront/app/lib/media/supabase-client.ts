import { createClient, SupabaseClient } from "@supabase/supabase-js";
import type { MediaEnv } from "./env";

let cachedClient: { key: string; client: SupabaseClient } | null = null;

/** Server-only client using the service-role key. Never import this from a client component. */
export function getSupabaseAdminClient(env: MediaEnv): SupabaseClient {
  const key = `${env.supabaseUrl}:${env.supabaseServiceRoleKey}`;
  if (cachedClient?.key === key) return cachedClient.client;

  const client = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cachedClient = { key, client };
  return client;
}

export async function uploadOptimizedVariant(
  env: MediaEnv,
  path: string,
  buffer: Buffer,
): Promise<void> {
  const client = getSupabaseAdminClient(env);
  const { error } = await client.storage.from(env.supabaseBucket).upload(path, buffer, {
    contentType: "image/webp",
    upsert: false,
  });
  if (error) throw new Error(`Supabase upload failed: ${error.message}`);
}

export async function removeOptimizedObjects(env: MediaEnv, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const client = getSupabaseAdminClient(env);
  const { error } = await client.storage.from(env.supabaseBucket).remove(paths);
  if (error) throw new Error(`Supabase removal failed: ${error.message}`);
}

export function getPublicUrl(env: MediaEnv, path: string): string {
  const client = getSupabaseAdminClient(env);
  return client.storage.from(env.supabaseBucket).getPublicUrl(path).data.publicUrl;
}
