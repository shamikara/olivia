"use client";

import { useEffect, useState } from "react";
import type { Discount } from "../lib/discount-store";

const BLANK = { code: "", type: "percent" as const, value: 10, minSpendLKR: 0, active: true, usageLimit: "", expiresAt: "" };

export function MarketingManager() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<typeof BLANK | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/discounts");
    const data = await res.json();
    setDiscounts(data.discounts ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const save = async () => {
    if (!draft) return;
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) {
      setFlash({ kind: "bad", text: data.error ?? "Could not save" });
      return;
    }
    setDraft(null);
    setFlash({ kind: "ok", text: `Code ${data.discount.code} saved` });
    await load();
  };

  const remove = async (code: string) => {
    if (!window.confirm(`Delete code ${code}?`)) return;
    await fetch(`/api/admin/discounts?code=${code}`, { method: "DELETE" });
    setFlash({ kind: "ok", text: `Code ${code} deleted` });
    await load();
  };

  const toggle = async (discount: Discount) => {
    await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...discount, active: !discount.active }),
    });
    await load();
  };

  return (
    <section className="manager">
      <div className="manager-tools">
        <button className="primary-action" onClick={() => setDraft({ ...BLANK })}>
          + New discount code
        </button>
      </div>

      {flash && <div className={`admin-flash ${flash.kind}`}>{flash.text}</div>}

      {draft && (
        <article className="admin-panel" style={{ marginTop: 18 }}>
          <h3>New code</h3>
          <div className="admin-field-grid">
            <label>
              Code
              <input
                value={draft.code}
                onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
                placeholder="GLOW10"
              />
            </label>
            <label>
              Type
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value as "percent" })}>
                <option value="percent">Percentage off</option>
                <option value="fixed">Fixed amount (LKR)</option>
              </select>
            </label>
            <label>
              Value
              <input type="number" value={draft.value} onChange={(e) => setDraft({ ...draft, value: Number(e.target.value) })} />
            </label>
            <label>
              Minimum spend (LKR)
              <input
                type="number"
                value={draft.minSpendLKR}
                onChange={(e) => setDraft({ ...draft, minSpendLKR: Number(e.target.value) })}
              />
            </label>
            <label>
              Usage limit (blank = unlimited)
              <input value={draft.usageLimit} onChange={(e) => setDraft({ ...draft, usageLimit: e.target.value })} />
            </label>
            <label>
              Expires
              <input type="date" value={draft.expiresAt} onChange={(e) => setDraft({ ...draft, expiresAt: e.target.value })} />
            </label>
          </div>
          <div className="admin-save-bar">
            <button onClick={() => setDraft(null)}>Cancel</button>
            <button className="primary-action" onClick={save}>
              Create code
            </button>
          </div>
        </article>
      )}

      {loading ? (
        <p className="admin-empty">Loading codes…</p>
      ) : discounts.length === 0 ? (
        <p className="admin-empty">No discount codes yet.</p>
      ) : (
        <div className="manager-table">
          <div className="product-row product-heading admin-discount-row">
            <span>CODE</span>
            <span>DISCOUNT</span>
            <span>MIN SPEND</span>
            <span>USED</span>
            <span>EXPIRES</span>
            <span>STATUS</span>
            <span></span>
          </div>
          {discounts.map((discount) => (
            <div className="product-row admin-discount-row" key={discount.code}>
              <b>{discount.code}</b>
              <span>
                {discount.type === "percent" ? `${discount.value}% off` : `LKR ${discount.value.toLocaleString()} off`}
              </span>
              <span>{discount.minSpendLKR ? `LKR ${discount.minSpendLKR.toLocaleString()}` : "—"}</span>
              <span>
                {discount.usageCount}
                {discount.usageLimit ? ` / ${discount.usageLimit}` : ""}
              </span>
              <span>{discount.expiresAt ? new Date(discount.expiresAt).toLocaleDateString("en-GB") : "Never"}</span>
              <em className={discount.active ? "" : "out-of-stock"}>{discount.active ? "Active" : "Paused"}</em>
              <span className="admin-actions-cell">
                <button onClick={() => toggle(discount)}>{discount.active ? "Pause" : "Activate"}</button>
                <button className="danger" onClick={() => remove(discount.code)}>
                  Delete
                </button>
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
