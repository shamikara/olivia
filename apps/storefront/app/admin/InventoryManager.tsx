"use client";

import { useEffect, useMemo, useState } from "react";
import type { BeautyProduct } from "../data/products";

const lkr = (value: number) => `LKR ${Math.round(value).toLocaleString("en-US")}`;

/**
 * Stock-focused view of the catalogue: adjust counts inline without opening the
 * full product editor.
 */
export function InventoryManager() {
  const [products, setProducts] = useState<BeautyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"all" | "low" | "out">("all");
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    setProducts(data.products ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products
      .filter((product) => {
        if (view === "out" && product.stockCount !== 0) return false;
        if (view === "low" && !(product.stockCount > 0 && product.stockCount <= 5)) return false;
        if (!needle) return true;
        return `${product.name} ${product.brand}`.toLowerCase().includes(needle);
      })
      .sort((a, b) => a.stockCount - b.stockCount);
  }, [products, query, view]);

  const save = async (product: BeautyProduct) => {
    const next = edits[product.id];
    if (next === undefined || next === product.stockCount) return;
    setSaving(product.id);
    const res = await fetch(`/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, stockCount: next }),
    });
    const data = await res.json();
    setSaving(null);
    if (!res.ok) {
      setFlash(data.error ?? "Could not update stock");
      return;
    }
    setProducts((current) => current.map((item) => (item.id === product.id ? data.product : item)));
    setEdits((current) => {
      const copy = { ...current };
      delete copy[product.id];
      return copy;
    });
    setFlash(`${product.shortName} set to ${next} in stock`);
  };

  const totals = useMemo(
    () => ({
      units: products.reduce((total, product) => total + product.stockCount, 0),
      value: products.reduce((total, product) => total + product.stockCount * product.priceLKR, 0),
      out: products.filter((product) => product.stockCount === 0).length,
      low: products.filter((product) => product.stockCount > 0 && product.stockCount <= 5).length,
    }),
    [products],
  );

  return (
    <section className="manager">
      <section className="admin-stats admin-stats-full" style={{ marginTop: 0 }}>
        <article>
          <p>UNITS IN STOCK</p>
          <h2>{totals.units}</h2>
          <small>Across {products.length} products</small>
        </article>
        <article>
          <p>STOCK VALUE</p>
          <h2>{lkr(totals.value)}</h2>
          <small>At current selling price</small>
        </article>
        <article>
          <p>LOW STOCK</p>
          <h2>{totals.low}</h2>
          <small className={totals.low ? "inventory-alert" : ""}>Five units or fewer</small>
        </article>
        <article>
          <p>OUT OF STOCK</p>
          <h2>{totals.out}</h2>
          <small className={totals.out ? "inventory-alert" : ""}>Hidden from Add to bag</small>
        </article>
      </section>

      <div className="manager-tools">
        <div className="product-search">
          ⌕
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or brand" />
        </div>
        <select className="admin-select" value={view} onChange={(e) => setView(e.target.value as typeof view)}>
          <option value="all">All products</option>
          <option value="low">Low stock only</option>
          <option value="out">Out of stock only</option>
        </select>
      </div>

      {flash && <div className="admin-flash ok">{flash}</div>}

      {loading ? (
        <p className="admin-empty">Loading inventory…</p>
      ) : visible.length === 0 ? (
        <p className="admin-empty">Nothing matches that filter.</p>
      ) : (
        <div className="manager-table">
          <div className="product-row product-heading admin-inventory-row">
            <span>Image</span>
            <span>PRODUCT</span>
            <span>BRAND</span>
            <span>PRICE</span>
            <span>IN STOCK</span>
            <span>VALUE</span>
            <span></span>
          </div>
          {visible.map((product) => {
            const pending = edits[product.id];
            const value = pending ?? product.stockCount;
            const changed = pending !== undefined && pending !== product.stockCount;
            return (
              <div className="product-row admin-inventory-row" key={product.id}>
                <img className="admin-thumb" src={product.image} alt="" />
                <b>
                  {product.name}
                  <small>{product.category}</small>
                </b>
                <span>{product.brand}</span>
                <span>{lkr(product.priceLKR)}</span>
                <input
                  className="admin-stock-input"
                  type="number"
                  min={0}
                  value={value}
                  onChange={(e) => setEdits({ ...edits, [product.id]: Math.max(0, Number(e.target.value)) })}
                />
                <span>{lkr(value * product.priceLKR)}</span>
                <button
                  className={changed ? "primary-action" : ""}
                  disabled={!changed || saving === product.id}
                  onClick={() => save(product)}
                >
                  {saving === product.id ? "…" : changed ? "Save" : "—"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
