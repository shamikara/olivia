import { promises as fs } from "node:fs";
import path from "node:path";
import { PRODUCTS_CATALOG, type BeautyProduct } from "../data/products";

/**
 * Server-side product storage.
 *
 * Products live in a JSON file that the admin panel writes to, seeded on first
 * read from the imported catalogue. This works on any host with a writable
 * disk; serverless platforms with a read-only filesystem (Vercel, Netlify)
 * need `readProducts`/`writeProducts` repointed at a database instead — that is
 * the only seam that has to change.
 */

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "products.json");

async function readFromDisk(): Promise<BeautyProduct[] | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as BeautyProduct[]) : null;
  } catch {
    return null;
  }
}

/*
 * Deliberately uncached. Route handlers and server components are separate
 * module instances, so an in-process cache goes stale the moment the admin
 * panel saves — the page would keep serving the copy it loaded first. Reading
 * a small JSON file per request is far cheaper than that class of bug.
 */
export async function getProducts(): Promise<BeautyProduct[]> {
  const stored = await readFromDisk();
  if (stored) return stored;

  // First run: seed the editable copy from the checked-in catalogue.
  try {
    await writeProducts(PRODUCTS_CATALOG);
  } catch {
    // Read-only disk — serve the seed and let writes report the problem.
  }
  return PRODUCTS_CATALOG;
}

export async function writeProducts(products: BeautyProduct[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), "utf8");
}

export async function getProduct(id: string): Promise<BeautyProduct | undefined> {
  return (await getProducts()).find((product) => product.id === id);
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
  const products = await getProducts();
  const remaining = products.filter((product) => product.id !== id);
  if (remaining.length === products.length) return false;
  await writeProducts(remaining);
  return true;
}
