"use client";

import Link from "next/link";
import { formatLKR, installmentAmount } from "../data/products";
import { SITE } from "../lib/site";
import { useStore } from "../lib/store";
import { CloseIcon } from "./Icons";

export function CartDrawer() {
  const { isCartOpen, closeCart, lines, subtotal, itemCount, setQuantity, removeFromCart } = useStore();
  if (!isCartOpen) return null;

  const remainingForFreeShipping = SITE.freeShippingThreshold - subtotal;

  return (
    <div className="overlay" onClick={closeCart} role="presentation">
      <aside
        className="panel panel-right"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
      >
        <div className="panel-head">
          <h2>
            Your bag <span className="mono muted">({itemCount})</span>
          </h2>
          <button className="icon-btn" onClick={closeCart} aria-label="Close bag">
            <CloseIcon />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="panel-body">
            <div className="empty-state">
              <span>✦</span>
              <h3>Your bag is empty</h3>
              <p>Start with a bestseller — most people begin with a sunscreen or a barrier serum.</p>
              <Link href="/shop" className="btn" onClick={closeCart}>
                Shop the edit
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="panel-body">
              {remainingForFreeShipping > 0 ? (
                <p className="installment" style={{ marginTop: 0 }}>
                  You&apos;re <strong>{formatLKR(remainingForFreeShipping)}</strong> away from free islandwide delivery.
                </p>
              ) : (
                <p className="installment" style={{ marginTop: 0 }}>
                  ✓ Free islandwide delivery unlocked.
                </p>
              )}

              {lines.map(({ product, quantity, lineTotal }) => (
                <article className="cart-line" key={product.id}>
                  <img src={product.image} alt="" />
                  <div className="cart-line-body">
                    <div className="cart-line-top">
                      <div>
                        <small>{product.brand}</small>
                        <h4>{product.shortName}</h4>
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
            </div>

            <div className="panel-foot">
              <div className="summary-row">
                <span>Subtotal</span>
                <strong>{formatLKR(subtotal)}</strong>
              </div>
              <div className="summary-row">
                <span className="muted">or 3 monthly payments of</span>
                <strong>{installmentAmount(subtotal, SITE.installmentMonths)}</strong>
              </div>
              <Link href="/cart" className="btn btn-block" onClick={closeCart}>
                Checkout · {formatLKR(subtotal)}
              </Link>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
