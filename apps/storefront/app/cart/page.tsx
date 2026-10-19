"use client";

import Link from "next/link";
import { usePublicSettings } from "../lib/public-settings";
import { useState } from "react";
import { StoreShell } from "../components/StoreShell";
import { formatLKR, installmentAmount } from "../data/products";
import { SITE } from "../lib/site";
import { useStore } from "../lib/store";

export default function CartPage() {
  const settings = usePublicSettings();
  const { lines, subtotal, itemCount, setQuantity, removeFromCart } = useStore();
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(0);
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState<string | null>(null);

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

            {settings.instalmentProviders.length > 0 && (
              <p className="installment">
                or {settings.installmentMonths} ×{" "}
                <strong>{installmentAmount(total, settings.installmentMonths)}</strong> interest-free
                <span className="pay-logos">
                  {settings.instalmentProviders.map((provider) => (
                    <span key={provider}>{provider}</span>
                  ))}
                </span>
              </p>
            )}

            <Link href="/checkout" className="btn btn-block">
              Checkout
            </Link>

            <p className="muted center" style={{ fontSize: "0.72rem", marginTop: 12 }}>
              Pay in instalments, on delivery, or arrange it with us on WhatsApp — you choose at the next step.
            </p>
          </aside>
        </section>
      )}
    </StoreShell>
  );
}
