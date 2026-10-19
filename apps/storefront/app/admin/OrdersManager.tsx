"use client";

import { useEffect, useMemo, useState } from "react";
import type { Order, OrderStatus } from "../lib/order-store";
import { KOKO_SURCHARGE_PERCENT } from "../lib/payments/surcharge";

const METHOD_LABEL: Record<string, string> = {
  cod: "Cash on delivery",
  whatsapp: "WhatsApp",
  koko: "Koko",
  mintpay: "Mintpay",
  paypal: "PayPal",
};

/*
 * The evidence matters as much as the status: Koko signs its callbacks, while
 * a Mintpay payment rests on a hash we generated ourselves, so those need
 * reconciling against the merchant portal before they are treated as money.
 */
const EVIDENCE_LABEL: Record<string, string> = {
  "signed-callback": "signed callback",
  "order-view": "confirmed with gateway",
  "return-hash": "return hash — reconcile",
  manual: "marked by hand",
};

function PaymentBadge({ order }: { order: Order }) {
  const method = METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod;
  const weak = order.paymentStatus === "paid" && order.paymentEvidence === "return-hash";
  return (
    <small className={`pay-badge pay-${order.paymentStatus}${weak ? " pay-weak" : ""}`}>
      {method} · {order.paymentStatus}
      {order.paymentEvidence ? ` (${EVIDENCE_LABEL[order.paymentEvidence] ?? order.paymentEvidence})` : ""}
    </small>
  );
}

const STATUSES: OrderStatus[] = ["pending", "confirmed", "packing", "shipped", "delivered", "cancelled"];
const lkr = (value: number) => `LKR ${Math.round(value).toLocaleString("en-US")}`;

export function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [open, setOpen] = useState<Order | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      setFlash("Could not load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  /*
   * Counts come from the unfiltered list on purpose: the tabs should keep
   * showing the whole picture while one of them is selected.
   */
  const counts = useMemo(() => {
    const tally: Record<string, number> = { all: orders.length };
    for (const status of STATUSES) tally[status] = 0;
    for (const order of orders) tally[order.status] = (tally[order.status] ?? 0) + 1;
    return tally;
  }, [orders]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (filter !== "all" && order.status !== filter) return false;
      if (!needle) return true;
      return `${order.reference} ${order.contactName} ${order.contactPhone}`.toLowerCase().includes(needle);
    });
  }, [orders, query, filter]);

  const changeStatus = async (order: Order, status: OrderStatus) => {
    const res = await fetch("/api/admin/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: order.id, status }),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash(data.error ?? "Could not update the order");
      return;
    }
    setOrders((current) => current.map((item) => (item.id === order.id ? data.order : item)));
    if (open?.id === order.id) setOpen(data.order);
    setFlash(`${order.reference} marked ${status}`);
  };

  return (
    <section className="manager">
      <div className="manager-tools">
        <div className="product-search">
          ⌕
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search reference, name or phone"
          />
        </div>
      </div>

      <div className="admin-filter-tabs" role="tablist" aria-label="Filter orders by status">
        {(["all", ...STATUSES] as const).map((status) => (
          <button
            key={status}
            role="tab"
            aria-selected={filter === status}
            className={filter === status ? "active" : ""}
            onClick={() => setFilter(status)}
          >
            {status === "all" ? "All" : status}
            <span>{counts[status] ?? 0}</span>
          </button>
        ))}
      </div>

      {flash && <div className="admin-flash ok">{flash}</div>}

      {loading ? (
        <p className="admin-empty">Loading orders…</p>
      ) : visible.length === 0 ? (
        <p className="admin-empty">
          {orders.length === 0 ? "No orders have been placed yet." : "No orders match that search."}
        </p>
      ) : (
        <div className="manager-table">
          <div className="product-row product-heading admin-orders-row">
            <span>REFERENCE</span>
            <span>CUSTOMER</span>
            <span>ITEMS</span>
            <span>TOTAL</span>
            <span>PLACED</span>
            <span>STATUS</span>
          </div>
          {visible.map((order) => (
            <div className="product-row admin-orders-row" key={order.id}>
              <b>
                <button className="linkish" onClick={() => setOpen(order)}>
                  {order.reference}
                </button>
                <small>{order.customerId ? "Account" : "Guest"}</small>
              </b>
              <span>
                {order.contactName}
                <br />
                <small className="muted">{order.contactPhone}</small>
              </span>
              <span>{order.lines.reduce((total, line) => total + line.quantity, 0)}</span>
              <span>
                {lkr(order.totalLKR)}
                <br />
                <PaymentBadge order={order} />
              </span>
              <span>{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span>
              <select
                className="admin-select"
                value={order.status}
                onChange={(event) => changeStatus(order, event.target.value as OrderStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="admin-editor-backdrop" onClick={() => setOpen(null)} role="presentation">
          <div className="admin-editor" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
            <header>
              <h2>{open.reference}</h2>
              <button onClick={() => setOpen(null)} aria-label="Close">
                ✕
              </button>
            </header>

            <div className="admin-editor-body">
              <div className="admin-order-meta">
                <div>
                  <p className="eyebrow">CUSTOMER</p>
                  <p>
                    {open.contactName}
                    <br />
                    {open.contactPhone}
                    <br />
                    {open.contactEmail ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">DELIVER TO</p>
                  <p>
                    {open.address ? (
                      <>
                        {open.address.line1}
                        {open.address.line2 ? <>, {open.address.line2}</> : null}
                        <br />
                        {open.address.city} {open.address.postalCode ?? ""}
                        <br />
                        {open.address.phone}
                      </>
                    ) : (
                      "No saved address — confirm on WhatsApp"
                    )}
                  </p>
                </div>
                <div>
                  <p className="eyebrow">PLACED</p>
                  <p>{new Date(open.createdAt).toLocaleString("en-GB")}</p>
                </div>
              </div>

              <div className="manager-table" style={{ marginTop: 20 }}>
                {open.lines.map((line) => (
                  <div className="product-row admin-orderline-row" key={line.productId}>
                    <img className="admin-thumb" src={line.image} alt="" />
                    <b>
                      {line.name}
                      <small>{line.brand}</small>
                    </b>
                    <span>
                      {line.quantity} × {lkr(line.unitPriceLKR)}
                    </span>
                    <span>{lkr(line.lineTotalLKR)}</span>
                  </div>
                ))}
              </div>

              <div className="admin-order-totals">
                <div>
                  <span>Subtotal</span>
                  <b>{lkr(open.subtotalLKR)}</b>
                </div>
                {open.discountLKR > 0 && (
                  <div>
                    <span>Discount {open.discountCode ? `(${open.discountCode})` : ""}</span>
                    <b>−{lkr(open.discountLKR)}</b>
                  </div>
                )}
                <div>
                  <span>Delivery</span>
                  <b>{open.shippingLKR === 0 ? "Free" : lkr(open.shippingLKR)}</b>
                </div>
                {open.paymentMethod === "koko" && (
                  <div>
                    <span>Koko fee ({KOKO_SURCHARGE_PERCENT}%)</span>
                    <b>{lkr(open.totalLKR - (open.subtotalLKR - open.discountLKR + open.shippingLKR))}</b>
                  </div>
                )}
                <div className="admin-order-total">
                  <span>Total</span>
                  <b>{lkr(open.totalLKR)}</b>
                </div>
              </div>
            </div>

            <footer>
              <select
                className="admin-select"
                value={open.status}
                onChange={(event) => changeStatus(open, event.target.value as OrderStatus)}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    Mark as {status}
                  </option>
                ))}
              </select>
              <button onClick={() => setOpen(null)}>Close</button>
            </footer>
          </div>
        </div>
      )}
    </section>
  );
}
