"use client";

import Link from "next/link";
import { formatLKR, installmentAmount } from "../data/products";
import { SITE } from "../lib/site";
import { useStore } from "../lib/store";
import { CloseIcon } from "./Icons";

export function QuickView() {
  const { quickViewId, closeQuickView, addToCart, catalog } = useStore();
  const product = quickViewId ? catalog.find((item) => item.id === quickViewId) : undefined;
  if (!product) return null;

  return (
    <div className="modal-wrap" onClick={closeQuickView} role="presentation">
      <div
        className="modal glass-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={product.name}
      >
        <button className="modal-close glass-chip" onClick={closeQuickView} aria-label="Close quick view">
          <CloseIcon />
        </button>

        <div className="modal-grid">
          <img className="modal-media" src={product.image} alt={product.name} />

          <div>
            <p className="eyebrow">{product.brand}</p>
            <h2 style={{ fontSize: "1.5rem" }}>{product.name}</h2>

            <div className="product-rating" style={{ marginTop: 10 }}>
              {product.rating !== undefined && (
                <>
                  <span className="stars" aria-hidden="true">
                    ★★★★★
                  </span>
                  <span>
                    {product.rating}
                    {product.reviewsCount ? ` · ${product.reviewsCount} reviews` : ""}
                  </span>
                </>
              )}
              {product.size && <span>{product.size}</span>}
            </div>

            <p className="muted" style={{ fontSize: "0.88rem", lineHeight: 1.7, marginBlock: 14 }}>
              {product.description}
            </p>

            <div className="pdp-meta">
              {product.benefits.slice(0, 3).map((benefit) => (
                <span className="tag" key={benefit}>
                  ✓ {benefit}
                </span>
              ))}
            </div>

            <div className="product-price">
              <span className="price-now" style={{ fontSize: "1.3rem" }}>
                {formatLKR(product.priceLKR)}
              </span>
              {product.originalPriceLKR && (
                <span className="price-was">{formatLKR(product.originalPriceLKR)}</span>
              )}
            </div>

            <p className="installment">
              {"or 3 × "}
              <strong>{installmentAmount(product.priceLKR, SITE.installmentMonths)}</strong>
              {" with Mintpay, Koko & Payzy"}
            </p>

            <button
              className="btn btn-block"
              onClick={() => {
                addToCart(product.id);
                closeQuickView();
              }}
            >
              Add to bag
            </button>

            <Link
              href={`/product/${product.id}`}
              className="link-underline"
              onClick={closeQuickView}
              style={{ marginTop: 16 }}
            >
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
