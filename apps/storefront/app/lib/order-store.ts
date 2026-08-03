import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Address } from "./customer-store";

const DATA_DIR = path.join(process.cwd(), "data");
const FILE = path.join(DATA_DIR, "orders.json");

export type OrderStatus = "pending" | "confirmed" | "packing" | "shipped" | "delivered" | "cancelled";

export interface OrderLine {
  productId: string;
  name: string;
  brand: string;
  image: string;
  quantity: number;
  unitPriceLKR: number;
  lineTotalLKR: number;
}

export interface Order {
  id: string;
  reference: string;
  customerId?: string;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  lines: OrderLine[];
  subtotalLKR: number;
  discountLKR: number;
  shippingLKR: number;
  totalLKR: number;
  discountCode?: string;
  address?: Address;
  note?: string;
  status: OrderStatus;
  createdAt: string;
}

async function readAll(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(orders: Order[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(orders, null, 2), "utf8");
}

/** Human-friendly reference the customer can quote on WhatsApp. */
function nextReference(existing: Order[]): string {
  const highest = existing.reduce((max, order) => {
    const n = Number(order.reference.replace(/\D/g, ""));
    return Number.isFinite(n) && n > max ? n : max;
  }, 1000);
  return `OG-${highest + 1}`;
}

export async function createOrder(input: Omit<Order, "id" | "reference" | "status" | "createdAt">): Promise<Order> {
  const orders = await readAll();
  const order: Order = {
    ...input,
    id: `ord_${randomUUID().slice(0, 12)}`,
    reference: nextReference(orders),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  orders.unshift(order);
  await writeAll(orders);
  return order;
}

export async function ordersForCustomer(customerId: string): Promise<Order[]> {
  return (await readAll()).filter((order) => order.customerId === customerId);
}

export async function allOrders(): Promise<Order[]> {
  return readAll();
}

export async function findOrderByReference(reference: string): Promise<Order | undefined> {
  const wanted = reference.trim().toUpperCase();
  return (await readAll()).find((order) => order.reference.toUpperCase() === wanted);
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  const orders = await readAll();
  const index = orders.findIndex((order) => order.id === id);
  if (index === -1) return undefined;
  orders[index] = { ...orders[index], status };
  await writeAll(orders);
  return orders[index];
}
