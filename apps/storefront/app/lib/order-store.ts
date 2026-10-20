import { randomUUID } from "node:crypto";
import type { Address } from "./customer-store";
import type { PaymentEvidence, PaymentMethod, PaymentStatus } from "./payments/types";
import { db, unwrap } from "./db/client";

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
  /** Optional backup number for the courier. */
  contactPhone2?: string;
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

const TABLE = "orders";

/** The columns an Order is built from, in one place so every query agrees. */
const COLUMNS =
  "id, reference, customer_id, contact_name, contact_phone, contact_phone_2, contact_email, lines, " +
  "subtotal_lkr, discount_lkr, shipping_lkr, total_lkr, discount_code, address, note, " +
  "status, created_at, payment_method, payment_status, gateway_reference, transaction_id, " +
  "payment_evidence, paid_at";

/* eslint-disable @typescript-eslint/no-explicit-any */
function toOrder(row: any): Order {
  return {
    id: row.id,
    reference: row.reference,
    customerId: row.customer_id ?? undefined,
    contactName: row.contact_name,
    contactPhone: row.contact_phone,
    contactPhone2: row.contact_phone_2 ?? undefined,
    contactEmail: row.contact_email ?? undefined,
    lines: (row.lines ?? []) as OrderLine[],
    subtotalLKR: row.subtotal_lkr,
    discountLKR: row.discount_lkr,
    shippingLKR: row.shipping_lkr,
    totalLKR: row.total_lkr,
    discountCode: row.discount_code ?? undefined,
    address: (row.address ?? undefined) as Address | undefined,
    note: row.note ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    gatewayReference: row.gateway_reference ?? undefined,
    transactionId: row.transaction_id ?? undefined,
    paymentEvidence: row.payment_evidence ?? undefined,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : undefined,
  };
}

export async function createOrder(
  input: Omit<Order, "id" | "reference" | "status" | "createdAt" | "paymentStatus"> &
    Partial<Pick<Order, "paymentStatus">>,
): Promise<Order> {
  /*
   * `reference` is deliberately absent: the column defaults to the next value
   * of order_reference_seq, so two simultaneous checkouts cannot be handed the
   * same number the way "highest existing + 1" did.
   */
  const row = await db()
    .from(TABLE)
    .insert({
      id: `ord_${randomUUID().slice(0, 12)}`,
      customer_id: input.customerId ?? null,
      contact_name: input.contactName,
      contact_phone: input.contactPhone,
      contact_phone_2: input.contactPhone2 ?? null,
      contact_email: input.contactEmail ?? null,
      lines: input.lines,
      subtotal_lkr: input.subtotalLKR,
      discount_lkr: input.discountLKR,
      shipping_lkr: input.shippingLKR,
      total_lkr: input.totalLKR,
      discount_code: input.discountCode ?? null,
      address: input.address ?? null,
      note: input.note ?? null,
      status: "pending",
      payment_method: input.paymentMethod,
      payment_status: input.paymentStatus ?? "unpaid",
      gateway_reference: input.gatewayReference ?? null,
      transaction_id: input.transactionId ?? null,
      payment_evidence: input.paymentEvidence ?? null,
    })
    .select(COLUMNS)
    .single();

  return toOrder(unwrap(row, "createOrder"));
}

export async function ordersForCustomer(customerId: string): Promise<Order[]> {
  const rows = await db()
    .from(TABLE)
    .select(COLUMNS)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  return unwrap(rows, "ordersForCustomer").map(toOrder);
}

export async function allOrders(): Promise<Order[]> {
  const rows = await db().from(TABLE).select(COLUMNS).order("created_at", { ascending: false });
  return unwrap(rows, "allOrders").map(toOrder);
}

export async function findOrderByReference(reference: string): Promise<Order | undefined> {
  // `ilike` with no wildcards is an exact, case-insensitive match — the
  // reference is quoted back to us by customers and by gateways, in whatever
  // case they please.
  const rows = await db().from(TABLE).select(COLUMNS).ilike("reference", reference.trim()).limit(1);
  const found = unwrap(rows, "findOrderByReference");
  return found.length > 0 ? toOrder(found[0]) : undefined;
}

export async function setOrderStatus(id: string, status: OrderStatus): Promise<Order | undefined> {
  const rows = await db().from(TABLE).update({ status }).eq("id", id).select(COLUMNS);
  const updated = unwrap(rows, "setOrderStatus");
  return updated.length > 0 ? toOrder(updated[0]) : undefined;
}

/**
 * Records the outcome of a gateway payment.
 *
 * Returns null when the order is unknown or has already reached a settled
 * payment state. That guard is what makes both the duplicated Koko callback
 * and the replayed Mintpay success URL harmless: whichever signal arrives
 * first wins, and nothing after it can move the order again.
 *
 * The guard is applied inside `settle_order_payment` (see migration 0002)
 * rather than here, so two callbacks arriving at once cannot both pass it.
 */
export async function settlePayment(
  reference: string,
  update: {
    status: Exclude<PaymentStatus, "unpaid" | "pending">;
    transactionId?: string;
    evidence: PaymentEvidence;
  },
): Promise<Order | null> {
  const rows = await db().rpc("settle_order_payment", {
    p_reference: reference,
    p_status: update.status,
    p_transaction_id: update.transactionId ?? null,
    p_evidence: update.evidence,
  });

  const settled = unwrap(rows, "settlePayment") as any[];
  return settled.length > 0 ? toOrder(settled[0]) : null;
}

/** Stores the gateway-side reference while a payment is in flight. */
export async function markPaymentPending(
  reference: string,
  gatewayReference: string,
): Promise<Order | undefined> {
  const rows = await db()
    .from(TABLE)
    .update({ payment_status: "pending", gateway_reference: gatewayReference })
    .eq("reference", reference)
    .select(COLUMNS);

  const updated = unwrap(rows, "markPaymentPending");
  return updated.length > 0 ? toOrder(updated[0]) : undefined;
}
