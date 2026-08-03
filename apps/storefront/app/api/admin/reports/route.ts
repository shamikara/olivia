import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import { allOrders } from "../../../lib/order-store";
import { getProducts } from "../../../lib/product-store";
import { requireAdmin } from "../../../lib/admin-auth";
import type { Customer } from "../../../lib/customer-store";

/** Escapes a value for CSV: quote it and double any embedded quotes. */
const cell = (value: unknown): string => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (headers: string[], rows: unknown[][]) =>
  [headers.join(","), ...rows.map((row) => row.map(cell).join(","))].join("\r\n");

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const type = new URL(request.url).searchParams.get("type") ?? "orders";
  let csv = "";
  let name = type;

  if (type === "orders") {
    const orders = await allOrders();
    csv = toCsv(
      ["Reference", "Placed", "Status", "Customer", "Phone", "Email", "Items", "Subtotal", "Discount", "Delivery", "Total", "City"],
      orders.map((order) => [
        order.reference,
        new Date(order.createdAt).toISOString(),
        order.status,
        order.contactName,
        order.contactPhone,
        order.contactEmail ?? "",
        order.lines.reduce((total, line) => total + line.quantity, 0),
        order.subtotalLKR,
        order.discountLKR,
        order.shippingLKR,
        order.totalLKR,
        order.address?.city ?? "",
      ]),
    );
  } else if (type === "order-lines") {
    const orders = await allOrders();
    csv = toCsv(
      ["Reference", "Placed", "Status", "Brand", "Product", "Quantity", "Unit price", "Line total"],
      orders.flatMap((order) =>
        order.lines.map((line) => [
          order.reference,
          new Date(order.createdAt).toISOString(),
          order.status,
          line.brand,
          line.name,
          line.quantity,
          line.unitPriceLKR,
          line.lineTotalLKR,
        ]),
      ),
    );
  } else if (type === "products") {
    const products = await getProducts();
    csv = toCsv(
      ["Id", "Name", "Brand", "Category", "Price", "Was price", "Stock", "Stock value", "Tag"],
      products.map((product) => [
        product.id,
        product.name,
        product.brand,
        product.category,
        product.priceLKR,
        product.originalPriceLKR ?? "",
        product.stockCount,
        product.priceLKR * product.stockCount,
        product.tag ?? "",
      ]),
    );
  } else if (type === "customers") {
    let customers: Customer[] = [];
    try {
      const raw = await fs.readFile(path.join(process.cwd(), "data", "customers.json"), "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) customers = parsed;
    } catch {
      customers = [];
    }
    const orders = await allOrders();
    csv = toCsv(
      ["Name", "Email", "Phone", "Joined", "Addresses", "Orders", "Lifetime value"],
      customers.map((customer) => {
        const theirs = orders.filter((order) => order.customerId === customer.id && order.status !== "cancelled");
        return [
          customer.name,
          customer.email,
          customer.phone ?? "",
          new Date(customer.createdAt).toISOString().slice(0, 10),
          customer.addresses.length,
          theirs.length,
          theirs.reduce((total, order) => total + order.totalLKR, 0),
        ];
      }),
    );
  } else {
    return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(`﻿${csv}`, {
    headers: {
      // BOM above so Excel opens UTF-8 correctly.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="olivia-glow-${name}-${stamp}.csv"`,
    },
  });
}
