import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyDiscount } from "../../lib/discount-store";
import { getProducts } from "../../lib/product-store";

/**
 * Checks a code for the cart before checkout. The subtotal is recomputed from
 * the catalogue rather than trusted from the request, so this can't be used to
 * probe what a code is worth against a made-up basket.
 */
export async function POST(request: NextRequest) {
  let body: { code?: string; items?: { id: string; quantity: number }[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const catalogue = await getProducts();
  const subtotal = (body.items ?? []).reduce((total, item) => {
    const product = catalogue.find((entry) => entry.id === item.id);
    if (!product) return total;
    const quantity = Math.max(1, Math.min(99, Math.round(Number(item.quantity) || 1)));
    return total + product.priceLKR * quantity;
  }, 0);

  const result = await applyDiscount(body.code ?? "", subtotal);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });
  return NextResponse.json({ discount: result.discount });
}
