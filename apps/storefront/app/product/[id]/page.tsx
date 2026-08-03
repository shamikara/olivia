"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { StoreShell } from "../../components/StoreShell";
import { ProductCard } from "../../components/ProductCard";
import { HeartIcon } from "../../components/Icons";
import { discountPercent, formatLKR, installmentAmount } from "../../data/products";
import { SITE, whatsappLink } from "../../lib/site";
import { useStore } from "../../lib/store";

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const { addToCart, openCart, toggleWishlist, isWishlisted, catalog } = useStore();
  const product = catalog.find((item) => item.id === params.id);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  if (!product) notFound();

  const images = [product.image, product.secondaryImage].filter((src): src is string => Boolean(src));
  const discount = discountPercent(product);
  const saved = isWishlisted(product.id);

  const related = catalog
    .filter((item) => item.id !== product.id && (item.category === product.category || item.brand === product.brand))
    .slice(0, 4);

  const buyNow = () => {
    addToCart(product.id, quantity);
    openCart();
  };

  return (
    <StoreShell>
      <div className="container">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">Home</Link> <span>/</span>
          <Link href="/shop">Shop</Link> <span>/</span>
          <Link href={`/shop?brand=${encodeURIComponent(product.brand)}`}>{product.brand}</Link> <span>/</span>
          <span className="muted">{product.shortName}</span>
        </nav>
      </div>

      <section className="container pdp">
        <div className="pdp-gallery">
          <div className="pdp-media">
            {product.tag && <span className="tag glass-chip">{product.tag}</span>}
            <img src={images[activeImage]} alt={product.name} />
          </div>

          <div className="pdp-thumbs">
            {images.map((image, index) => (
              <button
                key={image + index}
                aria-pressed={activeImage === index}
                onClick={() => setActiveImage(index)}
                aria-label={`View image ${index + 1}`}
              >
                <img src={image} alt="" />
              </button>
            ))}
          </div>
        </div>

        <div className="pdp-info">
          <p className="eyebrow">{product.brand}</p>
          <h1 style={{ fontSize: "clamp(1.8rem, 4.4vw, 2.7rem)" }}>{product.name}</h1>

          <div className="product-rating" style={{ marginTop: 14 }}>
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
            <span>{product.brand}</span>
          </div>

          <div className="pdp-price">
            <span className="price-now">{formatLKR(product.priceLKR)}</span>
            {product.originalPriceLKR && (
              <>
                <span className="price-was">{formatLKR(product.originalPriceLKR)}</span>
                <span className="price-save">Save {discount}%</span>
              </>
            )}
          </div>

          <p className="installment">
            or 3 × <strong>{installmentAmount(product.priceLKR, SITE.installmentMonths)}</strong> interest-free
            <span className="pay-logos">
              <span>Mintpay</span>
              <span>Koko</span>
              <span>Payzy</span>
            </span>
          </p>

          <p className="muted" style={{ lineHeight: 1.8, marginBlock: 18 }}>
            {product.description}
          </p>

          {product.concerns && product.concerns.length > 0 && (
            <div className="pdp-meta">
              {product.concerns.map((concern) => (
                <span className="tag" key={concern}>
                  {concern}
                </span>
              ))}
            </div>
          )}

          {product.stockCount > 0 && product.stockCount <= 5 && (
            <div className="urgency">
              <span>Only {product.stockCount} left in stock</span>
              {product.viewersCount && <span>{product.viewersCount} people viewing this today</span>}
            </div>
          )}
          {product.stockCount === 0 && (
            <div className="urgency">
              <span>Currently out of stock — message us to be notified</span>
            </div>
          )}

          <div className="pdp-buy">
            <div className="qty">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">
                −
              </button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} aria-label="Increase quantity">
                +
              </button>
            </div>
            <button className="btn" onClick={buyNow}>
              Add to bag · {formatLKR(product.priceLKR * quantity)}
            </button>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => toggleWishlist(product.id)}
              aria-pressed={saved}
            >
              <HeartIcon size={15} filled={saved} />
              {saved ? "Saved" : "Save for later"}
            </button>
            <a
              className="btn btn-whatsapp btn-sm"
              href={whatsappLink(`Hi Olivia Glow, I'd like to ask about ${product.name}.`)}
              target="_blank"
              rel="noopener noreferrer"
            >
              Ask about this product
            </a>
          </div>

          <p className="muted" style={{ fontSize: "0.75rem", marginTop: 16 }}>
            Free islandwide delivery over {formatLKR(SITE.freeShippingThreshold)} · Cash on delivery available ·
            Dispatched in 1–3 working days
          </p>

          <div className="accordion">
            <details open>
              <summary>Why you&apos;ll love it</summary>
              <div className="accordion-body">
                <ul>
                  {product.benefits.map((benefit) => (
                    <li key={benefit}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </details>

            {product.howToUse && (
              <details>
                <summary>How to use</summary>
                <div className="accordion-body">{product.howToUse}</div>
              </details>
            )}

            {product.keyIngredients && (
              <details>
                <summary>Key ingredients</summary>
                <div className="accordion-body">{product.keyIngredients}</div>
              </details>
            )}

            <details>
              <summary>Delivery &amp; payment</summary>
              <div className="accordion-body">
                Islandwide delivery in 1–3 working days. Free over {formatLKR(SITE.freeShippingThreshold)}. Pay by card,
                cash on delivery, or split into three interest-free monthly payments with Mintpay, Koko or Payzy.
              </div>
            </details>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="section-tight has-aura">
          <div className="aura aura-gold" style={{ width: 420, height: 420, top: -140, right: -160 }} />
          <div className="container">
            <div className="section-head">
              <div>
                <p className="eyebrow">Complete the ritual</p>
                <h2>
                  Pairs beautifully <span className="accent">with</span>
                </h2>
              </div>
              <Link href="/shop" className="link-underline">
                View all products →
              </Link>
            </div>

            <div className="product-grid">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      )}
    </StoreShell>
  );
}
