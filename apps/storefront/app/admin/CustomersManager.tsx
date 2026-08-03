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

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((res) => res.json())
      .then((data) => setRows(data.customers ?? []))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => `${row.name} ${row.email} ${row.phone ?? ""}`.toLowerCase().includes(needle));
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
            <div className="product-row admin-customers-row" key={row.id}>
              <b>
                {row.name}
                <small>Joined {date(row.createdAt)}</small>
              </b>
              <span>
                {row.email}
                <br />
                <small className="muted">{row.phone ?? "No phone"}</small>
              </span>
              <span>{row.addresses.length}</span>
              <span>{row.orderCount}</span>
              <span>{lkr(row.lifetimeValueLKR)}</span>
              <span>{date(row.lastOrderAt)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
