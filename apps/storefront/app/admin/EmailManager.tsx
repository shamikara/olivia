"use client";

import { useEffect, useState } from "react";

/**
 * Transactional mail, as the shop sees it: which emails go out, what fires
 * them, how each one currently looks, and a way to send one to yourself.
 *
 * The templates themselves are code — they carry layout, brand styling and
 * order data, and mail clients punish anything assembled loosely — so this
 * panel is deliberately read-and-test rather than an editor.
 */

interface TemplateSummary {
  key: string;
  label: string;
  trigger: string;
  subject: string;
}

interface Preview {
  key: string;
  subject: string;
  html: string;
}

export function EmailManager() {
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [from, setFrom] = useState("");
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [testTo, setTestTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/email")
      .then((res) => res.json())
      .then((data) => {
        setConfigured(data.configured);
        setFrom(data.from ?? "");
        setTemplates(data.templates ?? []);
        if (data.templates?.length) void show(data.templates[0].key);
      })
      .catch(() => setFlash({ kind: "bad", text: "Could not load the email templates" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const show = async (key: string) => {
    const res = await fetch(`/api/admin/email?template=${encodeURIComponent(key)}`);
    if (!res.ok) {
      setFlash({ kind: "bad", text: "Could not render that template" });
      return;
    }
    setPreview(await res.json());
  };

  const sendTest = async () => {
    if (!preview) return;
    setBusy(true);
    setFlash(null);
    try {
      const res = await fetch("/api/admin/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: preview.key, to: testTo }),
      });
      const data = await res.json();
      setFlash(
        res.ok
          ? { kind: "ok", text: `Sent to ${data.to}` }
          : { kind: "bad", text: data.error ?? "Could not send" },
      );
    } catch {
      setFlash({ kind: "bad", text: "Could not send" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="manager">
      {configured === false && (
        <p className="admin-warn">
          Outbound mail is switched off — no customer is receiving order confirmations, invoices or
          account emails. Set RESEND_API_KEY and EMAIL_FROM, and verify the sending domain in Resend
          so messages are not filtered.
        </p>
      )}
      {configured === true && (
        <p className="admin-hint">
          Sending as <strong>{from}</strong> via Resend.
        </p>
      )}
      {flash && <p className={flash.kind === "ok" ? "admin-flash" : "admin-warn"}>{flash.text}</p>}

      <div className="admin-settings-grid">
        <article className="admin-panel">
          <h3>Templates</h3>
          {templates.length === 0 && <p className="admin-empty">Nothing to show.</p>}
          {templates.map((template) => (
            <button
              key={template.key}
              className={`admin-select${preview?.key === template.key ? " active" : ""}`}
              onClick={() => void show(template.key)}
            >
              <strong>{template.label}</strong>
              <small>{template.trigger}</small>
            </button>
          ))}
        </article>

        <article className="admin-panel">
          <h3>Send a test</h3>
          <p className="admin-hint">
            Sends the selected template, filled with sample order data, to one address. Check it in
            the client your customers actually use before relying on it.
          </p>
          <input
            type="email"
            value={testTo}
            placeholder="you@example.com"
            onChange={(event) => setTestTo(event.target.value)}
          />
          <button className="btn" onClick={() => void sendTest()} disabled={busy || !preview || !testTo}>
            {busy ? "Sending…" : `Send ${preview?.key ?? ""} test`}
          </button>
        </article>
      </div>

      {preview && (
        <article className="admin-panel admin-panel-wide">
          <h3>{preview.subject}</h3>
          {/*
            Rendered in an iframe, not injected into the page: this is email
            HTML with its own table layout and inline styles, and it must not
            inherit — or leak into — the admin panel's own styling.
          */}
          <iframe
            title="Email preview"
            srcDoc={preview.html}
            sandbox=""
            style={{ width: "100%", height: "760px", border: "1px solid #e8e0d6", background: "#fff" }}
          />
        </article>
      )}
    </section>
  );
}
