import { PRODUCTS_CATALOG, type BeautyProduct } from "../data/products";
import { db, unwrap } from "./db/client";

/**
 * Server-side product storage, backed by the `products` table (migration 0002).
 *
 * Each row keeps the whole BeautyProduct record in `data`: the catalogue is
 * loaded in full and filtered in memory by every caller, so splitting it into
 * columns would buy nothing and would have to be revisited every time the
 * product shape changes.
 *
 * `sort_order` preserves what the array order used to mean — the admin list
 * shows newest first, and a newly created product appears at the top.
 */

const TABLE = "products";

/**
 * Products saved before galleries existed carry `secondaryImage` instead of
 * `gallery`. Folding it in here, at the read boundary, means the product page,
 * the editor and the cards all see one shape — rather than each remembering
 * to check both fields.
 */
export function withGallery(product: BeautyProduct): BeautyProduct {
  if (product.gallery?.length || !product.secondaryImage) return product;
  return { ...product, gallery: [product.secondaryImage] };
}

/* eslint-disable @typescript-eslint/no-explicit-any */
const toProduct = (row: any): BeautyProduct => withGallery(row.data as BeautyProduct);

/*
 * Deliberately uncached. Route handlers and server components are separate
 * module instances, so an in-process cache goes stale the moment the admin
 * panel saves — the page would keep serving the copy it loaded first.
 */
export async function getProducts(): Promise<BeautyProduct[]> {
  const rows = unwrap(
    await db().from(TABLE).select("id, sort_order, data").order("sort_order", { ascending: true }),
    "getProducts",
  );

  if (rows.length > 0) return rows.map(toProduct);

  // First run against an empty database: seed the editable copy from the
  // checked-in catalogue, then serve it.
  await writeProducts(PRODUCTS_CATALOG);
  return PRODUCTS_CATALOG.map(withGallery);
}

/**
 * Replaces the catalogue with exactly `products`, in the order given.
 *
 * Deletions are part of the contract — callers pass the full list and expect
 * anything missing from it to be gone — so rows no longer present are removed
 * rather than left behind.
 */
export async function writeProducts(products: BeautyProduct[]): Promise<void> {
  const client = db();

  if (products.length === 0) {
    unwrap(await client.from(TABLE).delete().neq("id", "").select("id"), "writeProducts (clear)");
    return;
  }

  unwrap(
    await client
      .from(TABLE)
      .upsert(
        products.map((product, index) => ({
          id: product.id,
          sort_order: index,
          data: product,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: "id" },
      )
      .select("id"),
    "writeProducts",
  );

  unwrap(
    await client
      .from(TABLE)
      .delete()
      .not("id", "in", `(${products.map((product) => product.id).join(",")})`)
      .select("id"),
    "writeProducts (prune)",
  );
}

export async function getProduct(id: string): Promise<BeautyProduct | undefined> {
  const rows = unwrap(await db().from(TABLE).select("data").eq("id", id).limit(1), "getProduct");
  return rows.length > 0 ? toProduct(rows[0]) : undefined;
}

export async function upsertProduct(product: BeautyProduct): Promise<BeautyProduct> {
  const products = [...(await getProducts())];
  const index = products.findIndex((item) => item.id === product.id);
  if (index >= 0) products[index] = product;
  else products.unshift(product);
  await writeProducts(products);
  return product;
}

export async function deleteProduct(id: string): Promise<boolean> {
  const rows = unwrap(await db().from(TABLE).delete().eq("id", id).select("id"), "deleteProduct");
  return rows.length > 0;
}
