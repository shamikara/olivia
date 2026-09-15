"use client";

import { useEffect, useState } from "react";

/**
 * Gateway credentials.
 *
 * Secrets are write-only here: the API never sends them back, so each field
 * shows whether something is stored and leaving it blank keeps what is there.
 * A value supplied by an environment variable is shown as locked, because
 * saving from this form would not override it.
 */

interface KokoView {
  enabled: boolean;
  testMode: boolean;
  merchantId: string;
  clientName: string;
  clientVersion: string;
  apiKeySet: boolean;
  publicKeySet: boolean;
  privateKeySet: boolean;
  ready: boolean;
}

interface MintpayView {
  enabled: boolean;
  testMode: boolean;
  merchantId: string;
  merchantSecretSet: boolean;
  ready: boolean;
}

interface PaypalView {
  enabled: boolean;
  testMode: boolean;
  clientId: string;
  clientSecretSet: boolean;
  ready: boolean;
}

interface PaymentsView {
  codEnabled: boolean;
  whatsappEnabled: boolean;
  koko: KokoView;
  mintpay: MintpayView;
  paypal: PaypalView;
}

type EnvFlags = Record<string, boolean>;

const SecretField = ({
  label,
  stored,
  fromEnv,
  value,
  onChange,
  textarea,
  hint,
}: {
  label: string;
  stored: boolean;
  fromEnv: boolean;
  value: string;
  onChange: (value: string) => void;
  textarea?: boolean;
  hint?: string;
}) => (
  <label>
    {label}
    <span className="admin-hint">
      {fromEnv ? "set by environment variable — this form cannot change it" : stored ? "stored — leave blank to keep" : "not set"}
      {hint ? ` · ${hint}` : ""}
    </span>
    {textarea ? (
      <textarea
        rows={4}
        value={value}
        disabled={fromEnv}
        placeholder={stored ? "••••••••" : "-----BEGIN …-----"}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
      />
    ) : (
      <input
        type="password"
        value={value}
        disabled={fromEnv}
        placeholder={stored ? "••••••••" : ""}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    )}
  </label>
);

export function PaymentsManager() {
  const [view, setView] = useState<PaymentsView | null>(null);
  const [env, setEnv] = useState<EnvFlags>({});
  const [flash, setFlash] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [secrets, setSecrets] = useState({
    kokoApiKey: "",
    kokoPublicKey: "",
    kokoPrivateKey: "",
    mintpaySecret: "",
    paypalClientSecret: "",
  });

  const load = () =>
    fetch("/api/admin/payments")
      .then((res) => res.json())
      .then((data) => {
        setView(data.payments);
        setEnv(data.fromEnvironment ?? {});
      });

  useEffect(() => {
    load();
  }, []);

  if (!view) return <p className="admin-empty">Loading payment settings…</p>;

  const setKoko = <K extends keyof KokoView>(key: K, value: KokoView[K]) =>
    setView((current) => (current ? { ...current, koko: { ...current.koko, [key]: value } } : current));
  const setMintpay = <K extends keyof MintpayView>(key: K, value: MintpayView[K]) =>
    setView((current) => (current ? { ...current, mintpay: { ...current.mintpay, [key]: value } } : current));
  const setPaypal = <K extends keyof PaypalView>(key: K, value: PaypalView[K]) =>
    setView((current) => (current ? { ...current, paypal: { ...current.paypal, [key]: value } } : current));

  const save = async () => {
    setBusy(true);
    setFlash(null);
    const res = await fetch("/api/admin/payments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        codEnabled: view.codEnabled,
        whatsappEnabled: view.whatsappEnabled,
        koko: {
          enabled: view.koko.enabled,
          testMode: view.koko.testMode,
          merchantId: view.koko.merchantId,
          clientName: view.koko.clientName,
          clientVersion: view.koko.clientVersion,
          apiKey: secrets.kokoApiKey,
          publicKey: secrets.kokoPublicKey,
          privateKey: secrets.kokoPrivateKey,
        },
        mintpay: {
          enabled: view.mintpay.enabled,
          testMode: view.mintpay.testMode,
          merchantId: view.mintpay.merchantId,
          merchantSecret: secrets.mintpaySecret,
        },
        paypal: {
          enabled: view.paypal.enabled,
          testMode: view.paypal.testMode,
          clientId: view.paypal.clientId,
          clientSecret: secrets.paypalClientSecret,
        },
      }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setFlash({ kind: "bad", text: data.error ?? "Could not save" });
      return;
    }
    setView(data.payments);
    setEnv(data.fromEnvironment ?? {});
    setSecrets({ kokoApiKey: "", kokoPublicKey: "", kokoPrivateKey: "", mintpaySecret: "", paypalClientSecret: "" });
    setFlash({ kind: "ok", text: "Payment settings saved." });
  };

  return (
    <section className="manager">
      {flash && <div className={`admin-flash ${flash.kind}`}>{flash.text}</div>}

      <div className="admin-settings-grid">
        <article className="admin-panel">
          <h3>Koko {view.koko.ready ? <em className="gw-ok">ready</em> : <em className="gw-off">incomplete</em>}</h3>
          <p className="admin-hint">
            3 interest-free instalments. Sandbox is qaapi.paykoko.com, live is prodapi.paykoko.com.
          </p>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.koko.enabled}
              onChange={(e) => setKoko("enabled", e.target.checked)}
            />
            Offer Koko at checkout
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.koko.testMode}
              onChange={(e) => setKoko("testMode", e.target.checked)}
            />
            Sandbox mode (no real money)
          </label>
          <label>
            Merchant ID
            <input
              value={view.koko.merchantId}
              disabled={env.kokoMerchantId}
              onChange={(e) => setKoko("merchantId", e.target.value)}
            />
          </label>
          <SecretField
            label="API key"
            stored={view.koko.apiKeySet}
            fromEnv={Boolean(env.kokoApiKey)}
            value={secrets.kokoApiKey}
            onChange={(v) => setSecrets({ ...secrets, kokoApiKey: v })}
          />
          <SecretField
            label="Koko public key"
            hint="verifies their callbacks"
            stored={view.koko.publicKeySet}
            fromEnv={Boolean(env.kokoPublicKey)}
            value={secrets.kokoPublicKey}
            onChange={(v) => setSecrets({ ...secrets, kokoPublicKey: v })}
            textarea
          />
          <SecretField
            label="Your private key"
            hint="signs your requests"
            stored={view.koko.privateKeySet}
            fromEnv={Boolean(env.kokoPrivateKey)}
            value={secrets.kokoPrivateKey}
            onChange={(v) => setSecrets({ ...secrets, kokoPrivateKey: v })}
            textarea
          />
          <label>
            Client name
            <span className="admin-hint">
              Sent as _pluginName. Confirm with Koko whether they whitelist this.
            </span>
            <input value={view.koko.clientName} onChange={(e) => setKoko("clientName", e.target.value)} />
          </label>
        </article>

        <article className="admin-panel">
          <h3>
            Mintpay {view.mintpay.ready ? <em className="gw-ok">ready</em> : <em className="gw-off">incomplete</em>}
          </h3>
          <p className="admin-hint">
            3 instalments or instant cashback. Sandbox is dev.mintpay.lk, live is app.mintpay.lk.
          </p>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.mintpay.enabled}
              onChange={(e) => setMintpay("enabled", e.target.checked)}
            />
            Offer Mintpay at checkout
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.mintpay.testMode}
              onChange={(e) => setMintpay("testMode", e.target.checked)}
            />
            Sandbox mode (no real money)
          </label>
          <label>
            Merchant ID
            <input
              value={view.mintpay.merchantId}
              disabled={env.mintpayMerchantId}
              onChange={(e) => setMintpay("merchantId", e.target.value)}
            />
          </label>
          <SecretField
            label="Merchant secret"
            stored={view.mintpay.merchantSecretSet}
            fromEnv={Boolean(env.mintpayMerchantSecret)}
            value={secrets.mintpaySecret}
            onChange={(v) => setSecrets({ ...secrets, mintpaySecret: v })}
          />
          <p className="admin-warn">
            Mintpay has no server-to-server callback — a payment is confirmed only by the shopper&apos;s
            browser returning with a hash we generated ourselves. Orders confirmed this way are marked
            &ldquo;return hash&rdquo; in the order list. Reconcile them against your Mintpay merchant
            portal before treating them as settled.
          </p>
        </article>

        <article className="admin-panel">
          <h3>
            PayPal {view.paypal.ready ? <em className="gw-ok">ready</em> : <em className="gw-off">incomplete</em>}
          </h3>
          <p className="admin-hint">
            Card/PayPal balance via PayPal&apos;s own embedded buttons — no redirect. PayPal does not
            settle in LKR, so the shopper is charged the LKR total converted to USD at checkout time.
          </p>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.paypal.enabled}
              onChange={(e) => setPaypal("enabled", e.target.checked)}
            />
            Offer PayPal at checkout
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.paypal.testMode}
              onChange={(e) => setPaypal("testMode", e.target.checked)}
            />
            Sandbox mode (no real money)
          </label>
          <label>
            Client ID
            <span className="admin-hint">Public — this is sent to the browser to load PayPal&apos;s buttons.</span>
            <input
              value={view.paypal.clientId}
              disabled={env.paypalClientId}
              onChange={(e) => setPaypal("clientId", e.target.value)}
            />
          </label>
          <SecretField
            label="Client secret"
            stored={view.paypal.clientSecretSet}
            fromEnv={Boolean(env.paypalClientSecret)}
            value={secrets.paypalClientSecret}
            onChange={(v) => setSecrets({ ...secrets, paypalClientSecret: v })}
          />
        </article>

        <article className="admin-panel">
          <h3>Other methods</h3>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.codEnabled}
              onChange={(e) => setView({ ...view, codEnabled: e.target.checked })}
            />
            Cash on delivery
          </label>
          <label className="admin-check">
            <input
              type="checkbox"
              checked={view.whatsappEnabled}
              onChange={(e) => setView({ ...view, whatsappEnabled: e.target.checked })}
            />
            Arrange on WhatsApp
          </label>
          <p className="admin-hint">
            Gateways need a publicly reachable site URL for their callbacks. Set NEXT_PUBLIC_SITE_URL in
            production, and use a tunnel when testing locally — Koko cannot post to localhost.
          </p>
        </article>
      </div>

      <button className="btn" onClick={save} disabled={busy}>
        {busy ? "Saving…" : "Save payment settings"}
      </button>
    </section>
  );
}
