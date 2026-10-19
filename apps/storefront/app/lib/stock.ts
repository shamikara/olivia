import type { Order } from "./order-store";
import { db } from "./db/client";

/**
 * Stock movement, driven by order status.
 *
 * Taken on confirmation rather than on checkout: an abandoned order or one
 * that turns out to be a duplicate should not hold inventory, and a confirmed
 * order is one the shop has actually looked at. Cancelling gives it back.
 *
 * The work happens in adjust_order_stock (migration 0006), which locks the
 * order row, so confirming the same order twice — or two admins acting at
 * once — still moves stock exactly once.
 */

/** Which direction, if any, a given status should move stock. */
function directionFor(status: Order["status"]): 1 | -1 | 0 {
  if (status === "confirmed" || status === "packing" || status === "shipped" || status === "delivered") {
    // Anything at or past confirmation holds its stock. Later statuses are
    // included so an order jumped straight to "shipped" is not missed.
    return 1;
  }
  if (status === "cancelled") return -1;
  return 0;
}

/**
 * Brings stock into line with an order's current status.
 *
 * Best-effort by design: it runs after the status has already been recorded,
 * and a stock-keeping failure must not make a successful status change look
 * like it failed. Failures are logged loudly enough to reconcile by hand.
 */
export async function syncStockForOrder(order: Order): Promise<void> {
  const direction = directionFor(order.status);
  if (direction === 0) return;

  try {
    const { data, error } = await db().rpc("adjust_order_stock", {
      p_order_id: order.id,
      p_direction: direction,
    });
    if (error) throw new Error(error.message);
    if (data === true) {
      console.info(
        `[stock] ${direction === 1 ? "reserved" : "returned"} stock for ${order.reference} (${order.status})`,
      );
    }
  } catch (error) {
    console.error(`[stock] could not adjust stock for ${order.reference}:`, (error as Error).message);
  }
}
