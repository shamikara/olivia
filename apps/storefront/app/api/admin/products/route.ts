import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getProducts, upsertProduct } from "../../../lib/product-store";
import { requireAdmin } from "../../../lib/admin-auth";
import { normaliseProduct } from "../../../lib/product-schema";
import { getMediaEnv } from "../../../lib/media/env";
import { reconcileProductMedia } from "../../../lib/media/media-store";
import type { BeautyProduct } from "../../../data/products";

/**
 * Retires any active media asset the product no longer references (e.g. an
 * image swapped or removed by means other than the upload endpoint). Never
 * blocks or fails the product save — media bookkeeping is secondary to it.
 */
export async function reconcileMediaBestEffort(product: BeautyProduct): Promise<void> {
  const env = getMediaEnv();
  if (!env) return;
  try {
    await reconcileProductMedia(env, product.id, { main: product.image, secondary: product.secondaryImage });
  } catch (error) {
    console.error(`[media-sync] reconcile failed for ${product.id}:`, (error as Error).message);
  }
}

export async function GET() {
  const products = await getProducts();
  return NextResponse.json({ products });
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const result = normaliseProduct(body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });

  const existing = (await getProducts()).some((product) => product.id === result.product.id);
  if (existing) return NextResponse.json({ error: "A product with that id already exists" }, { status: 409 });

  try {
    await upsertProduct(result.product);
  } catch (error) {
    return NextResponse.json({ error: storageMessage(error) }, { status: 500 });
  }

  await reconcileMediaBestEffort(result.product);

  return NextResponse.json({ product: result.product }, { status: 201 });
}

export function storageMessage(error: unknown): string {
  const code = (error as NodeJS.ErrnoException)?.code;
  if (code === "EROFS" || code === "EACCES" || code === "EPERM") {
    return "Storage is read-only on this host. Point product-store.ts at a database to enable editing in production.";
  }
  return error instanceof Error ? error.message : "Could not save product";
}
