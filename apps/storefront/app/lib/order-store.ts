import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Address } from "./customer-store";
import type { PaymentEvidence, PaymentMethod, PaymentStatus } from "./payments/types";

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

  /*
   * Payment state is tracked separately from fulfilment: a Koko order can be
   * paid while still sitting in "pending", and a cash-on-delivery order ships
   * while still unpaid. Collapsing the two loses both facts.
   */
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** The reference the gateway knows this order by, when it differs from ours. */
  gatewayReference?: string;
  transactionId?: string;
  /** How we came to believe it was paid — see payments/types. */
  paymentEvidence?: PaymentEvidence;
  paidAt?: string;
}

async function readAll(): Promise<Order[]> {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Orders written before payments existed have neither field.
    return (parsed as Order[]).map((order) => ({
      ...order,
      paymentMethod: order.paymentMethod ?? "whatsapp",
      paymentStatus: order.paymentStatus ?? "unpaid",
    }));
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

export async function createOrder(
  input: Omit<Order, "id" | "reference" | "status" | "createdAt" | "paymentStatus"> &
    Partial<Pick<Order, "paymentStatus">>,
): Promise<Order> {
  const orders = await readAll();
  const order: Order = {
    ...input,
    id: `ord_${randomUUID().slice(0, 12)}`,
    reference: nextReference(orders),
    status: "pending",
    paymentStatus: input.paymentStatus ?? "unpaid",
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

/**
 * Records the outcome of a gateway payment.
 *
 * Returns null when the order has already reached a settled payment state.
 * That single guard is what makes both the duplicated Koko callback and the
 * replayed Mintpay success URL harmless: whichever signal arrives first wins,
 * and nothing after it can move the order again.
 */
export async function settlePayment(
  reference: string,
  update: {
    status: Exclude<PaymentStatus, "unpaid" | "pending">;
    transactionId?: string;
    evidence: PaymentEvidence;
  },
): Promise<Order | null> {
  const orders = await readAll();
  const index = orders.findIndex((order) => order.reference === reference);
  if (index === -1) return null;

  const current = orders[index];
  if (current.paymentStatus === "paid" || current.paymentStatus === "cancelled") return null;

  const paid = update.status === "paid";
  orders[index] = {
    ...current,
    paymentStatus: update.status,
    transactionId: update.transactionId ?? current.transactionId,
    paymentEvidence: update.evidence,
    paidAt: paid ? new Date().toISOString() : current.paidAt,
    // A paid order is one the shop should act on; leave everything else alone.
    status: paid && current.status === "pending" ? "confirmed" : current.status,
  };
  await writeAll(orders);
  return orders[index];
}

/** Stores the gateway-side reference while a payment is in flight. */
export async function markPaymentPending(
  reference: string,
  gatewayReference: string,
): Promise<Order | undefined> {
  const orders = await readAll();
  const index = orders.findIndex((order) => order.reference === reference);
  if (index === -1) return undefined;
  orders[index] = { ...orders[index], paymentStatus: "pending", gatewayReference };
  await writeAll(orders);
  return orders[index];
}
