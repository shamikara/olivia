"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { Address, PublicCustomer } from "../lib/customer-store";
import type { Order } from "../lib/order-store";
import { formatLKR } from "../data/products";

const BLANK_ADDRESS = {
  id: "",
  label: "Home",
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  district: "",
  postalCode: "",
  isDefault: false,
};

const STATUS_LABEL: Record<Order["status"], string> = {
  pending: "Awaiting confirmation",
  confirmed: "Confirmed",
  packing: "Being packed",
  shipped: "On its way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function AccountDashboard({ customer, orders }: { customer: PublicCustomer; orders: Order[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"orders" | "addresses" | "details">("orders");
  const [profile, setProfile] = useState({ name: customer.name, phone: customer.phone ?? "" });
  const [addresses, setAddresses] = useState<Address[]>(customer.addresses);
  const [draft, setDraft] = useState<typeof BLANK_ADDRESS | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    const res = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    setBusy(false);
    setFlash(res.ok ? "Details saved" : "Could not save your details");
  };

  const saveAddress = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    setBusy(true);
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFlash(data.error ?? "Could not save the address");
      return;
    }
    setAddresses(data.customer.addresses);
    setDraft(null);
    setFlash("Address saved");
  };

  const removeAddress = async (id: string) => {
    if (!window.confirm("Remove this address?")) return;
    const res = await fetch(`/api/account/addresses?id=${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setAddresses(data.customer.addresses);
      setFlash("Address removed");
    }
  };

  return (
    <>
      <header className="page-head has-aura">
        <div className="aura aura-blush" style={{ width: 400, height: 400, top: -170, left: -130 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">Your account</p>
          <h1>
            Hello, <span className="accent">{customer.name.split(" ")[0]}.</span>
          </h1>
          <p className="lede">{customer.email}</p>
        </div>
      </header>

      <section className="container section-tight">
        <div className="account-tabs">
          {(["orders", "addresses", "details"] as const).map((key) => (
            <button key={key} className="chip" aria-pressed={tab === key} onClick={() => setTab(key)}>
              {key === "orders" ? `Orders (${orders.length})` : key === "addresses" ? `Addresses (${addresses.length})` : "Details"}
            </button>
          ))}
          <button className="chip account-signout" onClick={signOut}>
            Sign out
          </button>
        </div>

        {flash && <p className="account-flash">{flash}</p>}

        {tab === "orders" &&
          (orders.length === 0 ? (
            <div className="empty-state">
              <span>✦</span>
              <h3>No orders yet</h3>
              <p>When you place an order it will appear here with its reference and delivery status.</p>
              <Link className="btn" href="/shop">
                Start shopping
              </Link>
            </div>
          ) : (
            <div className="order-list">
              {orders.map((order) => (
                <article className="order-card" key={order.id}>
                  <header>
                    <div>
                      <b>{order.reference}</b>
                      <small>
                        {new Date(order.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </small>
                    </div>
                    <span className={`order-status status-${order.status}`}>{STATUS_LABEL[order.status]}</span>
                  </header>

                  <div className="order-lines">
                    {order.lines.map((line) => (
                      <div className="order-line" key={line.productId}>
                        <img src={line.image} alt="" />
                        <div>
                          <small>{line.brand}</small>
                          <p>{line.name}</p>
                        </div>
                        <span className="mono">
                          {line.quantity} × {formatLKR(line.unitPriceLKR)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <footer>
                    {order.address && (
                      <span className="muted">
                        {order.address.line1}, {order.address.city}
                      </span>
                    )}
                    <strong>{formatLKR(order.totalLKR)}</strong>
                  </footer>
                </article>
              ))}
            </div>
          ))}

        {tab === "addresses" && (
          <div>
            <div className="address-grid">
              {addresses.map((address) => (
                <article className="address-card" key={address.id}>
                  {address.isDefault && <span className="tag">Default</span>}
                  <h3>{address.label}</h3>
                  <p>
                    {address.fullName}
                    <br />
                    {address.line1}
                    {address.line2 ? <>, {address.line2}</> : null}
                    <br />
                    {address.city}
                    {address.district ? `, ${address.district}` : ""} {address.postalCode ?? ""}
                    <br />
                    {address.phone}
                  </p>
                  <div className="address-actions">
                    <button onClick={() => setDraft({ ...BLANK_ADDRESS, ...address, line2: address.line2 ?? "" })}>
                      Edit
                    </button>
                    <button onClick={() => removeAddress(address.id)}>Remove</button>
                  </div>
                </article>
              ))}

              <button className="address-add" onClick={() => setDraft({ ...BLANK_ADDRESS })}>
                + Add an address
              </button>
            </div>

            {draft && (
              <form className="address-form" onSubmit={saveAddress}>
                <h3>{draft.id ? "Edit address" : "New address"}</h3>
                <div className="address-fields">
                  <label>
                    Label
                    <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
                  </label>
                  <label>
                    Full name
                    <input
                      value={draft.fullName}
                      onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                      required
                    />
                  </label>
                  <label>
                    Phone
                    <input value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} required />
                  </label>
                  <label className="span-2">
                    Address line 1
                    <input value={draft.line1} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} required />
                  </label>
                  <label className="span-2">
                    Address line 2
                    <input value={draft.line2} onChange={(e) => setDraft({ ...draft, line2: e.target.value })} />
                  </label>
                  <label>
                    City
                    <input value={draft.city} onChange={(e) => setDraft({ ...draft, city: e.target.value })} required />
                  </label>
                  <label>
                    District
                    <input value={draft.district} onChange={(e) => setDraft({ ...draft, district: e.target.value })} />
                  </label>
                  <label>
                    Postal code
                    <input
                      value={draft.postalCode}
                      onChange={(e) => setDraft({ ...draft, postalCode: e.target.value })}
                    />
                  </label>
                  <label className="address-default">
                    <input
                      type="checkbox"
                      checked={draft.isDefault}
                      onChange={(e) => setDraft({ ...draft, isDefault: e.target.checked })}
                    />
                    Use as my default delivery address
                  </label>
                </div>
                <div className="address-form-actions">
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(null)}>
                    Cancel
                  </button>
                  <button className="btn btn-sm" type="submit" disabled={busy}>
                    {busy ? "Saving…" : "Save address"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {tab === "details" && (
          <form className="details-form" onSubmit={saveProfile}>
            <label>
              Name
              <input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required />
            </label>
            <label>
              Phone
              <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </label>
            <label>
              Email
              <input value={customer.email} disabled />
              <span className="auth-hint">Email cannot be changed here — message us and we&apos;ll move it.</span>
            </label>
            <button className="btn btn-sm" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save details"}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
