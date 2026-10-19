import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { allOrders } from "../../../lib/order-store";
import { requireAdmin } from "../../../lib/admin-auth";
import { allCustomers, toPublic } from "../../../lib/customer-store";

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const [customers, orders] = await Promise.all([allCustomers(), allOrders()]);

  // Password hashes are stripped by toPublic before anything leaves the server.
  const rows = customers.map((customer) => {
    const theirs = orders.filter((order) => order.customerId === customer.id && order.status !== "cancelled");
    return {
      ...toPublic(customer),
      orderCount: theirs.length,
      lifetimeValueLKR: theirs.reduce((total, order) => total + order.totalLKR, 0),
      lastOrderAt: theirs[0]?.createdAt ?? null,
    };
  });

  rows.sort((a, b) => b.lifetimeValueLKR - a.lifetimeValueLKR);
  return NextResponse.json({ customers: rows });
}
