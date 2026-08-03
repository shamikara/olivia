"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { StoreShell } from "../components/StoreShell";
import { formatLKR, installmentAmount } from "../data/products";
import { SITE, canPrefillWhatsApp, whatsappLink } from "../lib/site";
import { useStore } from "../lib/store";

export default function CartPage() {
  const { lines, subtotal, itemCount, setQuantity, removeFromCart, showToast, clearCart } = useStore();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(0);
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [needsContact, setNeedsContact] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "" });

  // The server is the authority on what a code is worth; this only mirrors it.
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
        setApplied(0);
        setCodeError(data.error ?? "That code isn't valid");
        return;
      }
      setApplied(data.discount.amountLKR);
    } catch {
      setCodeError("Could not check that code");
    } finally {
      setChecking(false);
    }
  };

  const discount = applied;
  const shipping = subtotal >= SITE.freeShippingThreshold || subtotal === 0 ? 0 : 450;
  const total = subtotal - discount + shipping;

  // MVP checkout: hand the order to a human on WhatsApp rather than fake a gateway.
  const orderMessage = [
    "Hi Olivia Glow, I'd like to place this order:",
    ...lines.map((line) => `• ${line.quantity} × ${line.product.name} — ${formatLKR(line.lineTotal)}`),
    applied ? `Discount code: ${code.toUpperCase()}` : "",
    `Total: ${formatLKR(total)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderMessage);
      showToast("Order copied — paste it into the chat");
    } catch {
      showToast("Couldn't copy automatically, please type your order");
    }
  };

  /*
   * Record the order first so it exists in the customer's history and the admin
   * can see it, then hand the conversation to WhatsApp with the reference.
   */
  const placeOrder = async () => {
    setPlacing(true);
    setOrderError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((line) => ({ id: line.product.id, quantity: line.quantity })),
          contactName: contact.name,
          contactPhone: contact.phone,
          discountCode: applied ? code : undefined,
        }),
      });
      const data = await res.json();

      if (res.status === 401 || res.status === 422) {
        // Guests must give us a name and number before we can take the order.
        setOrderError(data.error ?? "Please add your name and phone number");
        setNeedsContact(true);
        return;
      }
      if (!res.ok) {
        setOrderError(data.error ?? "Could not place the order");
        return;
      }

      const reference = data.order.reference as string;
      clearCart();
      const message = `${orderMessage}\n\nOrder reference: ${reference}`;
      if (!canPrefillWhatsApp) {
        await navigator.clipboard.writeText(message).catch(() => {});
      }
      window.open(whatsappLink(message), "_blank", "noopener");
      router.push(`/order/${reference}`);
    } catch {
      setOrderError("Network error — please try again");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <StoreShell>
      <header className="page-head has-aura">
        <div className="aura aura-blush" style={{ width: 380, height: 380, top: -160, left: -120 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">Your bag</p>
          <h1>
            A little glow <span className="accent">is on its way.</span>
          </h1>
        </div>
      </header>

      {itemCount === 0 ? (
        <section className="container section">
          <div className="empty-state">
            <span>✦</span>
            <h3>Your bag is empty</h3>
            <p>Most people start with a sunscreen and a barrier serum. Ours are two of the island&apos;s favourites.</p>
            <Link href="/shop" className="btn">
              Shop the edit
            </Link>
          </div>
        </section>
      ) : (
        <section className="container cart-layout">
          <div>
            {lines.map(({ product, quantity, lineTotal }) => (
              <article className="cart-line" key={product.id}>
                <Link href={`/product/${product.id}`}>
                  <img src={product.image} alt={product.name} />
                </Link>
                <div className="cart-line-body">
                  <div className="cart-line-top">
                    <div>
                      <small>{product.brand}</small>
                      <Link href={`/product/${product.id}`}>
                        <h4>{product.name}</h4>
                      </Link>
                      <p className="muted" style={{ fontSize: "0.72rem" }}>
                        {product.size}
                      </p>
                    </div>
                    <span className="cart-line-price">{formatLKR(lineTotal)}</span>
                  </div>

                  <div className="cart-line-actions">
                    <div className="qty">
                      <button onClick={() => setQuantity(product.id, quantity - 1)} aria-label="Decrease quantity">
                        −
                      </button>
                      <span>{quantity}</span>
                      <button onClick={() => setQuantity(product.id, quantity + 1)} aria-label="Increase quantity">
                        +
                      </button>
                    </div>
                    <button className="link-remove" onClick={() => removeFromCart(product.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            ))}

            <Link href="/shop" className="link-underline" style={{ marginTop: 24 }}>
              ← Continue shopping
            </Link>
          </div>

          <aside className="order-summary">
            <p className="eyebrow">Order summary</p>

            <div className="summary-row">
              <span>Subtotal ({itemCount} items)</span>
              <strong>{formatLKR(subtotal)}</strong>
            </div>
            <div className="summary-row">
              <span>Delivery</span>
              <strong>{shipping === 0 ? "Free" : formatLKR(shipping)}</strong>
            </div>
            {applied > 0 && (
              <div className="summary-row" style={{ color: "var(--green)" }}>
                <span>Discount ({code.trim().toUpperCase()})</span>
                <strong>−{formatLKR(discount)}</strong>
              </div>
            )}

            <div className="promo-row">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
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

            {needsContact && (
              <div className="checkout-contact">
                <p className="muted" style={{ fontSize: "0.74rem", marginBottom: 10 }}>
                  Checking out as a guest — where should we send it?{" "}
                  <Link href="/account/login?next=/cart" className="link-underline">
                    Sign in
                  </Link>
                </p>
                <input
                  placeholder="Your name"
                  value={contact.name}
                  onChange={(event) => setContact({ ...contact, name: event.target.value })}
                />
                <input
                  placeholder="Phone number"
                  value={contact.phone}
                  onChange={(event) => setContact({ ...contact, phone: event.target.value })}
                />
              </div>
            )}

            <p className="installment">
              or 3 × <strong>{installmentAmount(total, SITE.installmentMonths)}</strong> interest-free
              <span className="pay-logos">
                <span>Mintpay</span>
                <span>Koko</span>
                <span>Payzy</span>
              </span>
            </p>

            <button className="btn btn-block" onClick={placeOrder} disabled={placing}>
              {placing ? "Placing order…" : "Place order"}
            </button>
            {orderError && (
              <p className="muted center" style={{ fontSize: "0.72rem", color: "var(--berry)", marginTop: 10 }}>
                {orderError}
              </p>
            )}

            {!canPrefillWhatsApp && (
              <button className="btn btn-ghost btn-sm btn-block" onClick={copyOrder} style={{ marginTop: 10 }}>
                Copy order details
              </button>
            )}

            <p className="muted center" style={{ fontSize: "0.72rem", marginTop: 12 }}>
              We confirm stock and delivery with you before any payment. Cash on delivery available islandwide.
            </p>
          </aside>
        </section>
      )}
    </StoreShell>
  );
}
