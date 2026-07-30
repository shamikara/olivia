"use client";

import Link from "next/link";
import { useState } from "react";
import { StoreShell } from "../components/StoreShell";
import { formatLKR, installmentAmount } from "../data/products";
import { SITE, canPrefillWhatsApp, whatsappLink } from "../lib/site";
import { useStore } from "../lib/store";

export default function CartPage() {
  const { lines, subtotal, itemCount, setQuantity, removeFromCart, showToast } = useStore();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);

  const discount = applied ? Math.round(subtotal * 0.1) : 0;
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
            {applied && (
              <div className="summary-row" style={{ color: "var(--green)" }}>
                <span>Discount (GLOW10)</span>
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
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setApplied(code.trim().toUpperCase() === "GLOW10")}
              >
                Apply
              </button>
            </div>
            {code && !applied && (
              <p className="muted" style={{ fontSize: "0.72rem", marginBottom: 12 }}>
                Try GLOW10 for 10% off your first order.
              </p>
            )}

            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>{formatLKR(total)}</strong>
            </div>

            <p className="installment">
              or 3 × <strong>{installmentAmount(total, SITE.installmentMonths)}</strong> interest-free
              <span className="pay-logos">
                <span>Mintpay</span>
                <span>Koko</span>
                <span>Payzy</span>
              </span>
            </p>

            <a
              className="btn btn-block"
              href={whatsappLink(orderMessage)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                // Without a configured number WhatsApp drops the prefilled text,
                // so put the order on the clipboard on the way out.
                if (!canPrefillWhatsApp) void copyOrder();
              }}
            >
              Place order on WhatsApp
            </a>

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
