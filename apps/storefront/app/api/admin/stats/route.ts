import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { allOrders } from "../../../lib/order-store";
import { getProducts } from "../../../lib/product-store";
import { requireAdmin } from "../../../lib/admin-auth";
import type { Customer } from "../../../lib/customer-store";

async function readCustomers(): Promise<Customer[]> {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "customers.json"), "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Everything the dashboard needs, computed from the real stores. */
export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const [products, orders, customers] = await Promise.all([getProducts(), allOrders(), readCustomers()]);

  const live = orders.filter((order) => order.status !== "cancelled");
  const revenue = live.reduce((total, order) => total + order.totalLKR, 0);

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todays = live.filter((order) => new Date(order.createdAt) >= startOfToday);

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recent = live.filter((order) => new Date(order.createdAt).getTime() >= thirtyDaysAgo);

  // Units sold per product, for the bestseller list.
  const sold = new Map<string, number>();
  for (const order of live) {
    for (const line of order.lines) {
      sold.set(line.productId, (sold.get(line.productId) ?? 0) + line.quantity);
    }
  }

  const bestsellers = [...sold.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, units]) => {
      const product = products.find((item) => item.id === id);
      return { id, units, name: product?.name ?? id, brand: product?.brand ?? "" };
    });

  // Revenue for the last 12 days, for the chart.
  const trend: { label: string; total: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - i);
    const next = new Date(day);
    next.setDate(next.getDate() + 1);
    const total = live
      .filter((order) => {
        const at = new Date(order.createdAt);
        return at >= day && at < next;
      })
      .reduce((sum, order) => sum + order.totalLKR, 0);
    trend.push({ label: day.toLocaleDateString("en-GB", { day: "numeric", month: "short" }), total });
  }

  return NextResponse.json({
    revenueLKR: revenue,
    revenueTodayLKR: todays.reduce((total, order) => total + order.totalLKR, 0),
    revenue30dLKR: recent.reduce((total, order) => total + order.totalLKR, 0),
    orders: orders.length,
    ordersToday: todays.length,
    pendingOrders: orders.filter((order) => order.status === "pending").length,
    deliveredOrders: orders.filter((order) => order.status === "delivered").length,
    averageOrderLKR: live.length ? Math.round(revenue / live.length) : 0,
    customers: customers.length,
    products: products.length,
    outOfStock: products.filter((product) => product.stockCount === 0).length,
    lowStock: products.filter((product) => product.stockCount > 0 && product.stockCount <= 5).length,
    stockValueLKR: products.reduce((total, product) => total + product.priceLKR * product.stockCount, 0),
    bestsellers,
    trend,
    lowStockList: products
      .filter((product) => product.stockCount <= 5)
      .sort((a, b) => a.stockCount - b.stockCount)
      .slice(0, 8)
      .map((product) => ({ id: product.id, name: product.name, stock: product.stockCount })),
  });
}
