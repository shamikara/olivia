import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { allOrders, setOrderStatus, type OrderStatus } from "../../../lib/order-store";
import { requireAdmin } from "../../../lib/admin-auth";

const STATUSES: OrderStatus[] = ["pending", "confirmed", "packing", "shipped", "delivered", "cancelled"];

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;
  return NextResponse.json({ orders: await allOrders() });
}

export async function PATCH(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: { id?: string; status?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!body.id) return NextResponse.json({ error: "Order id is required" }, { status: 400 });
  if (!STATUSES.includes(body.status as OrderStatus)) {
    return NextResponse.json({ error: `Status must be one of: ${STATUSES.join(", ")}` }, { status: 422 });
  }

  const order = await setOrderStatus(body.id, body.status as OrderStatus);
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order });
}
