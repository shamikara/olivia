"use client";

import Link from "next/link";
import { discountPercent, formatLKR, installmentAmount, type BeautyProduct } from "../data/products";
import { SITE } from "../lib/site";
import { useStore } from "../lib/store";
import { HeartIcon } from "./Icons";

export function ProductCard({ product }: { product: BeautyProduct }) {
  const { addToCart, toggleWishlist, isWishlisted, openQuickView } = useStore();
  const saved = isWishlisted(product.id);
  const discount = discountPercent(product);

  return (
    <article className="product-card">
      <div className="product-media">
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </Link>

        {product.tag && <span className="tag glass-chip">{product.tag}</span>}

        <button
          className="wish-btn glass-chip"
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.shortName} from saved` : `Save ${product.shortName}`}
        >
          <HeartIcon filled={saved} />
        </button>

        <button className="quick-btn glass-chip" onClick={() => openQuickView(product.id)}>
          Quick view
        </button>
      </div>

      <div className="product-body">
        <span className="product-brand">{product.brand}</span>
        <Link href={`/product/${product.id}`}>
          <h3 className="product-name">{product.name}</h3>
        </Link>

        {product.rating !== undefined ? (
          <div className="product-rating">
            <span className="stars" aria-hidden="true">
              ★★★★★
            </span>
            <span>
              {product.rating}
              {product.reviewsCount ? ` · ${product.reviewsCount}` : ""}
            </span>
          </div>
        ) : (
          product.size && <div className="product-rating">{product.size}</div>
        )}

        <div className="product-price">
          <span className="price-now">{formatLKR(product.priceLKR)}</span>
          {product.originalPriceLKR && (
            <>
              <span className="price-was">{formatLKR(product.originalPriceLKR)}</span>
              <span className="price-save">−{discount}%</span>
            </>
          )}
        </div>

        <div className="installment">
          or 3 × <strong>{installmentAmount(product.priceLKR, SITE.installmentMonths)}</strong>
          <div className="pay-logos">
            <span>Mintpay</span>
            <span>Koko</span>
            <span>Payzy</span>
          </div>
        </div>

        {product.stockCount === 0 ? (
          <p className="stock-note">Out of stock</p>
        ) : (
          product.stockCount <= 5 && <p className="stock-note">Only {product.stockCount} left</p>
        )}

        <button
          className="btn btn-sm btn-block"
          onClick={() => addToCart(product.id)}
          disabled={product.stockCount === 0}
        >
          {product.stockCount === 0 ? "Sold out" : "Add to bag"}
        </button>
      </div>
    </article>
  );
}
