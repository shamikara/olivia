"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { Address } from "../lib/customer-store";
import type { PaymentOption } from "../lib/payments";
import type { GatewayRedirect } from "../lib/payments/types";
import { formatLKR, installmentAmount } from "../data/products";
import { canPrefillWhatsApp, whatsappLink } from "../lib/site";
import { useStore } from "../lib/store";
import { AddressFields, type AddressDraft } from "../components/AddressFields";

interface Props {
  options: PaymentOption[];
  districts: string[];
  installmentMonths: number;
  freeShippingThresholdLKR: number;
  flatShippingLKR: number;
  customer: { name: string; email: string; phone: string; addresses: Address[] } | null;
}

const BLANK: AddressDraft = { line1: "", line2: "", city: "", district: "", postalCode: "" };

/**
 * Posts the gateway hand-off.
 *
 * Both providers take a form POST, not a redirect, and the fields carry a
 * signature made server-side — so the browser's only job is to submit what it
 * was handed, untouched.
 */
function submitToGateway(redirect: GatewayRedirect): void {
  const form = document.createElement("form");
  form.method = redirect.method;
  form.action = redirect.action;
  form.style.display = "none";
  for (const [name, value] of Object.entries(redirect.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  document.body.appendChild(form);
  form.submit();
}

export function CheckoutForm({
  options,
  districts,
  installmentMonths,
  freeShippingThresholdLKR,
  flatShippingLKR,
  customer,
}: Props) {
  const { lines, subtotal, itemCount, clearCart, showToast, hydrated } = useStore();
  const router = useRouter();

  const [contact, setContact] = useState({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
  });
  const defaultAddress = customer?.addresses.find((entry) => entry.isDefault) ?? customer?.addresses[0];
  const [addressId, setAddressId] = useState<string>(defaultAddress?.id ?? "new");
  const [address, setAddress] = useState(BLANK);
  const [method, setMethod] = useState<string>(options[0]?.method ?? "whatsapp");
  const [code, setCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const shipping = subtotal >= freeShippingThresholdLKR || subtotal === 0 ? 0 : flatShippingLKR;
  const total = subtotal - discount + shipping;
  const chosen = useMemo(() => options.find((o) => o.method === method), [options, method]);
  const needsAddress = method === "koko" || method === "mintpay" || method === "cod";
  const usingSaved = addressId !== "new";

  // An empty bag has nothing to check out — but only once the bag has actually
  // been read back from storage, or every visit bounces straight to /cart.
  useEffect(() => {
    if (hydrated && itemCount === 0) router.replace("/cart");
  }, [hydrated, itemCount, router]);

  const checkCode = async () => {
    setChecking(true);
    setCodeError(null);
    try {
      const res = await fetch("/api/discount", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          items: lines.map((line) => ({ id: line.product.id, quantity: line.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDiscount(0);
        setCodeError(data.error ?? "That code isn't valid");
        return;
      }
      setDiscount(data.discount.amountLKR);
    } catch {
      setCodeError("Could not check that code");
    } finally {
      setChecking(false);
    }
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({ id: line.product.id, quantity: line.quantity })),
          contactName: contact.name,
          contactPhone: contact.phone,
          contactEmail: contact.email || undefined,
          addressId: usingSaved ? addressId : undefined,
          address: usingSaved || !needsAddress ? undefined : { ...address, fullName: contact.name, phone: contact.phone },
          discountCode: discount ? code : undefined,
          note: note || undefined,
          paymentMethod: method,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Could not place the order");
        return;
      }

      const reference: string = data.order.reference;

      // The gateway could not be opened — the order stands, so fall back to a
      // human rather than stranding the shopper.
      if (data.fallback) {
        setError(`${data.error}. Your order ${reference} is saved — we'll follow up on WhatsApp.`);
        return;
      }

      if (data.redirect) {
        clearCart();
        submitToGateway(data.redirect);
        return;
      }

      clearCart();
      if (method === "whatsapp") {
        const message = [
          "Hi Olivia Glow, I'd like to place this order:",
          ...lines.map((line) => `• ${line.quantity} × ${line.product.name} — ${formatLKR(line.lineTotal)}`),
          `Total: ${formatLKR(total)}`,
          "",
          `Order reference: ${reference}`,
        ].join("\n");
        if (!canPrefillWhatsApp) {
          await navigator.clipboard.writeText(message).catch(() => {});
          showToast("Order copied — paste it into the chat");
        }
        window.open(whatsappLink(message), "_blank", "noopener");
      }
      router.push(`/order/${reference}`);
    } catch {
      setError("Network error — please try again");
    } finally {
      setPlacing(false);
    }
  };

  if (!hydrated) {
    return (
      <p className="container muted center" style={{ padding: "70px 0 110px" }}>
        Loading your bag…
      </p>
    );
  }
  if (itemCount === 0) return null;

  return (
    <section className="container checkout-layout">
      <div className="checkout-main">
        <section className="checkout-block">
          <h2>Your details</h2>
          <div className="field-grid">
            <label>
              <span>Full name</span>
              <input
                value={contact.name}
                onChange={(e) => setContact({ ...contact, name: e.target.value })}
                autoComplete="name"
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                value={contact.phone}
                onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                autoComplete="tel"
                inputMode="tel"
              />
            </label>
            <label className="field-wide">
              <span>Email {method === "koko" || method === "mintpay" ? "" : "(optional)"}</span>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact({ ...contact, email: e.target.value })}
                autoComplete="email"
              />
            </label>
          </div>
          {!customer && (
            <p className="muted" style={{ fontSize: "0.74rem" }}>
              Have an account?{" "}
              <Link href="/account/login?next=/checkout" className="link-underline">
                Sign in
              </Link>{" "}
              to use a saved address.
            </p>
          )}
        </section>

        {needsAddress && (
          <section className="checkout-block">
            <h2>Delivery address</h2>
            {customer && customer.addresses.length > 0 && (
              <div className="address-choices">
                {customer.addresses.map((saved) => (
                  <label key={saved.id} className="address-choice" data-active={addressId === saved.id}>
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === saved.id}
                      onChange={() => setAddressId(saved.id)}
                    />
                    <span>
                      <b>{saved.label}</b>
                      <small>
                        {saved.line1}
                        {saved.line2 ? `, ${saved.line2}` : ""}, {saved.city}
                      </small>
                    </span>
                  </label>
                ))}
                <label className="address-choice" data-active={addressId === "new"}>
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === "new"}
                    onChange={() => setAddressId("new")}
                  />
                  <span>
                    <b>Use a different address</b>
                  </span>
                </label>
              </div>
            )}

            {!usingSaved && (
              <div className="field-grid">
                <AddressFields
                  value={address}
                  onChange={setAddress}
                  districts={districts}
                  wideClassName="field-wide"
                />
              </div>
            )}
          </section>
        )}

        <section className="checkout-block">
          <h2>How would you like to pay?</h2>
          <div className="pay-choices">
            {options.map((option) => (
              <label key={option.method} className="pay-choice" data-active={method === option.method}>
                <input
                  type="radio"
                  name="payment"
                  checked={method === option.method}
                  onChange={() => setMethod(option.method)}
                />
                <span>
                  <b>
                    {option.method === "koko" ? (
                      <img src="/images/payments/koko-logo.png" alt="Koko" className="pay-logo" />
                    ) : (
                      option.label
                    )}
                    {option.testMode && <em className="pay-test">sandbox</em>}
                  </b>
                  <small>{option.blurb}</small>
                  {option.instalments && (
                    <small className="pay-split">
                      3 × <strong>{installmentAmount(total, installmentMonths)}</strong>
                    </small>
                  )}
                </span>
              </label>
            ))}
          </div>
          {chosen?.testMode && (
            <p className="checkout-warning">
              {chosen.label} is in sandbox mode — no real money will move.
            </p>
          )}
        </section>

        <section className="checkout-block">
          <h2>Anything we should know?</h2>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Delivery instructions, a gift note…"
          />
        </section>
      </div>

      <aside className="order-summary checkout-summary">
        <p className="eyebrow">Order summary</p>

        {lines.map(({ product, quantity, lineTotal }) => (
          <div className="summary-line" key={product.id}>
            <img src={product.image} alt="" />
            <span>
              <b>{product.shortName}</b>
              <small>Qty {quantity}</small>
            </span>
            <strong>{formatLKR(lineTotal)}</strong>
          </div>
        ))}

        <div className="summary-row">
          <span>Subtotal ({itemCount} items)</span>
          <strong>{formatLKR(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Delivery</span>
          <strong>{shipping === 0 ? "Free" : formatLKR(shipping)}</strong>
        </div>
        {discount > 0 && (
          <div className="summary-row" style={{ color: "var(--green)" }}>
            <span>Discount ({code.trim().toUpperCase()})</span>
            <strong>−{formatLKR(discount)}</strong>
          </div>
        )}

        <div className="promo-row">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Discount code"
            aria-label="Discount code"
          />
          <button className="btn btn-ghost btn-sm" onClick={checkCode} disabled={checking}>
            {checking ? "…" : "Apply"}
          </button>
        </div>
        {codeError && (
          <p style={{ fontSize: "0.72rem", marginBottom: 12, color: "var(--berry)" }}>{codeError}</p>
        )}

        <div className="summary-row summary-total">
          <span>Total</span>
          <strong>{formatLKR(total)}</strong>
        </div>

        <button className="btn btn-block" onClick={placeOrder} disabled={placing}>
          {placing
            ? "Placing order…"
            : chosen && (method === "koko" || method === "mintpay")
              ? `Continue to ${chosen.label}`
              : "Place order"}
        </button>

        {error && (
          <p className="muted center" style={{ fontSize: "0.72rem", color: "var(--berry)", marginTop: 10 }}>
            {error}
          </p>
        )}

        <Link href="/cart" className="link-underline" style={{ display: "block", marginTop: 14, textAlign: "center" }}>
          ← Back to bag
        </Link>
      </aside>
    </section>
  );
}
