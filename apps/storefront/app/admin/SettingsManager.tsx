"use client";

import { useEffect, useState } from "react";
import type { StoreSettings } from "../lib/settings-store";

export function SettingsManager() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [flash, setFlash] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings));
  }, []);

  if (!settings) return <p className="admin-empty">Loading settings…</p>;

  const set = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) =>
    setSettings((current) => (current ? { ...current, [key]: value } : current));

  const save = async () => {
    setBusy(true);
    setFlash(null);
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFlash({ kind: "bad", text: data.error ?? "Could not save" });
      return;
    }
    setSettings(data.settings);
    setFlash({ kind: "ok", text: "Settings saved — the storefront picks these up immediately." });
  };

  return (
    <section className="manager">
      {flash && <div className={`admin-flash ${flash.kind}`}>{flash.text}</div>}

      <div className="admin-settings-grid">
        <article className="admin-panel">
          <h3>Store</h3>
          <label>
            Store name
            <input value={settings.storeName} onChange={(e) => set("storeName", e.target.value)} />
          </label>
          <label>
            Tagline
            <input value={settings.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </label>
          <label>
            Support email
            <input value={settings.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} />
          </label>
        </article>

        <article className="admin-panel">
          <h3>WhatsApp</h3>
          <label>
            Phone number (international, digits only)
            <input
              value={settings.whatsappPhone}
              onChange={(e) => set("whatsappPhone", e.target.value)}
              placeholder="94771234567"
            />
            <small>
              {settings.whatsappPhone
                ? "Set — order details will be prefilled into the chat."
                : "Not set. Without it WhatsApp drops the order text and customers must paste it themselves."}
            </small>
          </label>
          <label>
            Fallback chat link
            <input value={settings.whatsappLink} onChange={(e) => set("whatsappLink", e.target.value)} />
          </label>
        </article>

        <article className="admin-panel">
          <h3>Delivery &amp; payment</h3>
          <label>
            Free delivery over (LKR)
            <input
              type="number"
              value={settings.freeShippingThresholdLKR}
              onChange={(e) => set("freeShippingThresholdLKR", Number(e.target.value))}
            />
          </label>
          <label>
            Flat delivery charge (LKR)
            <input
              type="number"
              value={settings.flatShippingLKR}
              onChange={(e) => set("flatShippingLKR", Number(e.target.value))}
            />
          </label>
          <label>
            Instalment months
            <input
              type="number"
              value={settings.installmentMonths}
              onChange={(e) => set("installmentMonths", Number(e.target.value))}
            />
          </label>
          <label>
            Low stock warning at
            <input
              type="number"
              value={settings.lowStockThreshold}
              onChange={(e) => set("lowStockThreshold", Number(e.target.value))}
            />
          </label>
        </article>

        <article className="admin-panel">
          <h3>Social links</h3>
          <label>
            Instagram
            <input value={settings.instagram} onChange={(e) => set("instagram", e.target.value)} />
          </label>
          <label>
            TikTok
            <input value={settings.tiktok} onChange={(e) => set("tiktok", e.target.value)} />
          </label>
          <label>
            Facebook
            <input value={settings.facebook} onChange={(e) => set("facebook", e.target.value)} />
          </label>
        </article>

        <article className="admin-panel admin-panel-wide">
          <h3>Announcement bar</h3>
          <label>
            One message per line — they scroll across the top of the storefront
            <textarea
              rows={6}
              value={settings.announcements.join("\n")}
              onChange={(e) => set("announcements", e.target.value.split("\n"))}
            />
          </label>
        </article>
      </div>

      <div className="admin-save-bar">
        <button className="primary-action" onClick={save} disabled={busy}>
          {busy ? "Saving…" : "Save settings"}
        </button>
      </div>
    </section>
  );
}
