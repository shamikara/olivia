import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { deleteProduct, getProduct, upsertProduct } from "../../../../lib/product-store";
import { requireAdmin } from "../../../../lib/admin-auth";
import { normaliseProduct } from "../../../../lib/product-schema";
import { storageMessage } from "../route";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Context) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PUT(request: NextRequest, { params }: Context) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  const existing = await getProduct(id);
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // The id in the path always wins, so an edit can't silently clone a product.
  const result = normaliseProduct({ ...(body as object), id });
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 422 });

  try {
    await upsertProduct(result.product);
  } catch (error) {
    return NextResponse.json({ error: storageMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ product: result.product });
}

export async function DELETE(request: NextRequest, { params }: Context) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const { id } = await params;
  try {
    const removed = await deleteProduct(id);
    if (!removed) return NextResponse.json({ error: "Not found" }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: storageMessage(error) }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
