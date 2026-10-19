"use client";

import { useEffect, useMemo, useState } from "react";
import type { PublicCustomer } from "../lib/customer-store";

type Row = PublicCustomer & {
  orderCount: number;
  lifetimeValueLKR: number;
  lastOrderAt: string | null;
};

const lkr = (value: number) => `LKR ${Math.round(value).toLocaleString("en-US")}`;
const date = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function CustomersManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  // Which customer's saved addresses are expanded. One at a time: the panel
  // is tall, and two open at once makes the table hard to read.
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => setRows(data.customers ?? []))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    // Addresses are searchable too: the shop often looks someone up by the
    // town on the parcel rather than by name.
    return rows.filter((row) =>
      `${row.name} ${row.email} ${row.phone ?? ""} ${row.addresses
        .map((a) => `${a.fullName} ${a.phone} ${a.line1} ${a.line2 ?? ""} ${a.city} ${a.district ?? ""} ${a.postalCode ?? ""}`)
        .join(" ")}`
        .toLowerCase()
        .includes(needle),
    );
  }, [rows, query]);

  return (
    <section className="manager">
      <div className="manager-tools">
        <div className="product-search">
          ⌕
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, email or phone"
          />
        </div>
      </div>

      {loading ? (
        <p className="admin-empty">Loading customers…</p>
      ) : visible.length === 0 ? (
        <p className="admin-empty">
          {rows.length === 0 ? "No one has created an account yet." : "No customers match that search."}
        </p>
      ) : (
        <div className="manager-table">
          <div className="product-row product-heading admin-customers-row">
            <span>CUSTOMER</span>
            <span>CONTACT</span>
            <span>ADDRESSES</span>
            <span>ORDERS</span>
            <span>LIFETIME VALUE</span>
            <span>LAST ORDER</span>
          </div>
          {visible.map((row) => (
            <div key={row.id}>
              <div
                className="product-row admin-customers-row admin-row-clickable"
                onClick={() => setOpen(open === row.id ? null : row.id)}
                role="button"
                tabIndex={0}
                aria-expanded={open === row.id}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setOpen(open === row.id ? null : row.id);
                  }
                }}
              >
                <b>
                  {row.name}
                  <small>Joined {date(row.createdAt)}</small>
                </b>
                <span>
                  {row.email}
                  <br />
                  <small className="muted">{row.phone ?? "No phone"}</small>
                </span>
                <span>
                  {row.addresses.length === 0 ? (
                    <small className="muted">None saved</small>
                  ) : (
                    <>
                      {row.addresses.length} saved
                      <br />
                      <small className="muted">{open === row.id ? "Hide ▲" : "View ▼"}</small>
                    </>
                  )}
                </span>
                <span>{row.orderCount}</span>
                <span>{lkr(row.lifetimeValueLKR)}</span>
                <span>{date(row.lastOrderAt)}</span>
              </div>

              {open === row.id && (
                <div className="admin-address-panel">
                  {row.addresses.length === 0 ? (
                    <p className="admin-empty">
                      This customer has not saved an address. One is captured at checkout and stored
                      on the order itself, so their past orders still show where they went.
                    </p>
                  ) : (
                    <div className="admin-address-grid">
                      {row.addresses.map((address) => (
                        <div className="admin-address-card" key={address.id}>
                          <div className="admin-address-head">
                            <strong>{address.label || "Address"}</strong>
                            {address.isDefault && <span className="admin-address-default">Default</span>}
                          </div>
                          <p>
                            {address.fullName}
                            <br />
                            {address.line1}
                            {address.line2 && (
                              <>
                                <br />
                                {address.line2}
                              </>
                            )}
                            <br />
                            {address.city}
                            {address.district ? `, ${address.district}` : ""}
                            {address.postalCode ? ` ${address.postalCode}` : ""}
                          </p>
                          <p className="muted">{address.phone}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
