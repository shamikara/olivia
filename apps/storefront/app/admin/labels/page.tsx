"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Order } from "../../lib/order-store";
import { usePublicSettings } from "../../lib/public-settings";
import { PrintIcon } from "../../components/Icons";
import "./labels.css";

/**
 * Printable delivery labels.
 *
 * Its own page rather than a modal over the orders table, because printing
 * means handing the whole document to the printer: a dialog would drag the
 * admin shell, the sidebar and the table along with it. Here the page *is*
 * the labels.
 *
 * Covered by the /admin middleware, so it needs no auth of its own.
 *
 * Reached as /admin/labels?refs=OG-1001,OG-1002 — one label per reference,
 * each on its own sheet.
 */

const money = (value: number) => `LKR ${Math.round(value).toLocaleString("en-US")}`;

/** What the courier collects at the door. Zero for anything already paid. */
function amountDue(order: Order): number {
  if (order.paymentStatus === "paid") return 0;
  return order.paymentMethod === "cod" || order.paymentMethod === "whatsapp" ? order.totalLKR : 0;
}

function Label({ order, storeName, storePhone }: { order: Order; storeName: string; storePhone: string }) {
  const address = order.address;
  const due = amountDue(order);
  const items = order.lines.reduce((total, line) => total + line.quantity, 0);

  return (
    <article className="label-sheet">
      <header className="label-head">
        <div>
          <p className="label-eyebrow">Deliver to</p>
        </div>
        <div className="label-ref">{order.reference}</div>
      </header>

      <div className="label-to">
        <strong>{address?.fullName || order.contactName}</strong>
        {address ? (
          <>
            <span>{address.line1}</span>
            {address.line2 && <span>{address.line2}</span>}
            <span>
              {address.city}
              {address.district ? `, ${address.district}` : ""}
              {address.postalCode ? ` ${address.postalCode}` : ""}
            </span>
          </>
        ) : (
          <span className="label-noaddress">No address on this order — confirm before dispatch</span>
        )}
        <span className="label-phone">
          {[address?.phone || order.contactPhone, order.contactPhone2].filter(Boolean).join(" / ")}
        </span>
      </div>

      {/*
        The courier reads this before handing the parcel over, so it is the
        loudest thing on the label after the address. A prepaid parcel says so
        explicitly rather than leaving the box empty, which reads as "unknown".
      */}
      <div className={due > 0 ? "label-cod label-cod-due" : "label-cod label-cod-paid"}>
        {due > 0 ? (
          <>
            <span>Collect on delivery</span>
            <strong>{money(due)}</strong>
          </>
        ) : (
          <>
            <span>Paid in advance</span>
            <strong>Collect nothing</strong>
          </>
        )}
      </div>

      <div className="label-meta">
        <span>
          {items} item{items === 1 ? "" : "s"}
        </span>
        <span>{new Date(order.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
        <span className="label-method">{order.paymentMethod}</span>
      </div>

      <footer className="label-from">
        <p className="label-eyebrow">Return to</p>
        <span>
          {storeName}
          {storePhone ? ` · ${storePhone}` : ""}
        </span>
      </footer>
    </article>
  );
}

function LabelSheet() {
  const params = useSearchParams();
  const settings = usePublicSettings();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refs = useMemo(
    () =>
      (params.get("refs") ?? "")
        .split(",")
        .map((ref) => ref.trim().toUpperCase())
        .filter(Boolean),
    [params],
  );

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Could not load orders"))))
      .then((data) => {
        const all: Order[] = data.orders ?? [];
        // Kept in the order they were requested, so a printed stack matches
        // the order the packer selected them in.
        const wanted = refs
          .map((ref) => all.find((order) => order.reference.toUpperCase() === ref))
          .filter((order): order is Order => Boolean(order));
        setOrders(wanted);
      })
      .catch((err) => setError(err.message));
  }, [refs]);

  // Opens the print dialog once, after the labels have actually rendered —
  // printing an empty page is the classic failure here.
  useEffect(() => {
    if (orders && orders.length > 0) {
      const timer = setTimeout(() => window.print(), 250);
      return () => clearTimeout(timer);
    }
  }, [orders]);

  if (error) return <p className="label-message">{error}</p>;
  if (!orders) return <p className="label-message">Loading labels…</p>;
  if (refs.length === 0) return <p className="label-message">No orders selected.</p>;
  if (orders.length === 0) return <p className="label-message">None of those references matched an order.</p>;

  return (
    <>
      <div className="label-toolbar">
        <button onClick={() => window.print()}>
          <PrintIcon size={15} />
          Print {orders.length} label{orders.length === 1 ? "" : "s"}
        </button>
        <button onClick={() => window.close()}>Close</button>
        {orders.length < refs.length && (
          <span className="label-warn">{refs.length - orders.length} reference(s) not found</span>
        )}
      </div>
      {orders.map((order) => (
        <Label
          key={order.id}
          order={order}
          storeName={settings.storeName}
          storePhone={settings.whatsappPhone}
        />
      ))}
    </>
  );
}

export default function LabelsPage() {
  return (
    <main className="label-page">
      <Suspense fallback={<p className="label-message">Loading…</p>}>
        <LabelSheet />
      </Suspense>
    </main>
  );
}
