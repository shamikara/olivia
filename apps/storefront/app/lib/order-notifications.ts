import type { Order } from "./order-store";
import { sendEmail } from "./email/send";
import { invoiceEmail, orderConfirmationEmail, orderStatusEmail } from "./email/templates";

/**
 * Order mail, in one place so every payment route sends the same thing.
 *
 * All of these are fire-and-forget by design — see email/send.ts. A failure
 * to send is logged and never propagates: an order that was placed and paid
 * for must not be reported as failed because a receipt bounced.
 */

/** Sent the moment an order is placed, before any payment is taken. */
export async function notifyOrderPlaced(order: Order): Promise<void> {
  await sendEmail(order.contactEmail, orderConfirmationEmail(order), { copyShop: true });
}

/**
 * Sent when a gateway payment settles.
 *
 * Call this only with the order `settlePayment` returned. That function
 * updates the row under a WHERE guard and returns null for an order that was
 * already settled, so a caller that respects its result sends exactly one
 * invoice however many times Koko repeats its callback.
 */
export async function notifyPaymentSettled(order: Order): Promise<void> {
  if (order.paymentStatus !== "paid") return;
  await sendEmail(order.contactEmail, invoiceEmail(order), { copyShop: true });
}

/**
 * Sent when the shop moves an order along. Confirming an order that is not
 * paid through a gateway (cash on delivery, WhatsApp) is also the point the
 * customer gets their invoice, marked payable on delivery.
 */
export async function notifyStatusChanged(order: Order): Promise<void> {
  await sendEmail(order.contactEmail, orderStatusEmail(order));
  if (order.status === "confirmed" && order.paymentStatus !== "paid") {
    await sendEmail(order.contactEmail, invoiceEmail(order), { copyShop: true });
  }
}
