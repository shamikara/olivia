"use client";

import { useEffect, useState } from "react";

interface Stats {
  revenueLKR: number;
  revenueTodayLKR: number;
  revenue30dLKR: number;
  orders: number;
  ordersToday: number;
  pendingOrders: number;
  deliveredOrders: number;
  averageOrderLKR: number;
  customers: number;
  products: number;
  outOfStock: number;
  lowStock: number;
  stockValueLKR: number;
  bestsellers: { id: string; name: string; brand: string; units: number }[];
  trend: { label: string; total: number }[];
  lowStockList: { id: string; name: string; stock: number }[];
}

const lkr = (value: number) => `LKR ${Math.round(value).toLocaleString("en-US")}`;

export function Overview({ onNavigate }: { onNavigate: (module: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("failed"))))
      .then(setStats)
      .catch(() => setError("Could not load dashboard figures"));
  }, []);

  if (error) return <p className="admin-empty">{error}</p>;
  if (!stats) return <p className="admin-empty">Loading figures…</p>;

  const peak = Math.max(...stats.trend.map((day) => day.total), 1);

  const kpis: [string, string, string][] = [
    ["TOTAL REVENUE", lkr(stats.revenueLKR), `${stats.orders} orders all time`],
    ["REVENUE TODAY", lkr(stats.revenueTodayLKR), `${stats.ordersToday} orders today`],
    ["LAST 30 DAYS", lkr(stats.revenue30dLKR), "Excludes cancelled orders"],
    ["AVERAGE ORDER", lkr(stats.averageOrderLKR), "Across completed orders"],
    ["PENDING ORDERS", String(stats.pendingOrders), stats.pendingOrders > 0 ? "Action needed" : "All caught up"],
    ["DELIVERED", String(stats.deliveredOrders), "Fulfilled to date"],
    ["CUSTOMERS", String(stats.customers), "Registered accounts"],
    ["PRODUCTS", String(stats.products), `${lkr(stats.stockValueLKR)} stock value`],
    ["OUT OF STOCK", String(stats.outOfStock), stats.outOfStock > 0 ? "Action needed" : "Nothing sold out"],
    ["LOW STOCK", String(stats.lowStock), stats.lowStock > 0 ? "Restock soon" : "Healthy"],
  ];

  return (
    <>
      <section className="admin-stats admin-stats-full">
        {kpis.map(([label, value, note]) => (
          <article key={label}>
            <p>{label}</p>
            <h2>{value}</h2>
            <small className={/action needed|restock/i.test(note) ? "inventory-alert" : ""}>{note}</small>
          </article>
        ))}
      </section>

      <section className="admin-grid">
        <article className="sales-card">
          <div className="admin-card-title">
            <div>
              <p className="eyebrow">REVENUE, LAST 12 DAYS</p>
              <h2>{lkr(stats.revenue30dLKR)}</h2>
            </div>
            <button onClick={() => onNavigate("Orders")}>View orders</button>
          </div>
          {stats.revenueLKR === 0 ? (
            <p className="admin-empty">No orders yet — the chart fills in as they arrive.</p>
          ) : (
            <>
              <div className="chart">
                {stats.trend.map((day) => (
                  <i key={day.label} style={{ height: `${Math.max(2, (day.total / peak) * 100)}%` }} title={`${day.label}: ${lkr(day.total)}`} />
                ))}
              </div>
              <div className="chart-labels">
                <span>{stats.trend[0]?.label}</span>
                <span>{stats.trend[stats.trend.length - 1]?.label}</span>
              </div>
            </>
          )}
        </article>

        <article className="stock-card">
          <p className="eyebrow">INVENTORY WATCH</p>
          <h2>Low stock</h2>
          {stats.lowStockList.length === 0 ? (
            <p className="admin-empty">Everything is above five units.</p>
          ) : (
            stats.lowStockList.map((item) => (
              <div key={item.id}>
                <span>{item.name.slice(0, 34)}</span>
                <b>{item.stock === 0 ? "Out of stock" : `${item.stock} left`}</b>
              </div>
            ))
          )}
          <a onClick={() => onNavigate("Products")} style={{ cursor: "pointer" }}>
            Manage inventory →
          </a>
        </article>
      </section>

      <section className="orders-card">
        <div className="admin-card-title">
          <div>
            <p className="eyebrow">WHAT IS SELLING</p>
            <h2>Bestsellers</h2>
          </div>
        </div>
        {stats.bestsellers.length === 0 ? (
          <p className="admin-empty">No sales recorded yet.</p>
        ) : (
          <div className="order-table">
            <div className="order-row heading">
              <span>PRODUCT</span>
              <span>BRAND</span>
              <span>UNITS SOLD</span>
            </div>
            {stats.bestsellers.map((item) => (
              <div className="order-row bestseller-row" key={item.id}>
                <b>{item.name}</b>
                <span>{item.brand}</span>
                <span>{item.units}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
