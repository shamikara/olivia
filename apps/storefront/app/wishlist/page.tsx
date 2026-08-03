"use client";

import Link from "next/link";
import { StoreShell } from "../components/StoreShell";
import { ProductCard } from "../components/ProductCard";
import { useStore } from "../lib/store";

export default function WishlistPage() {
  const { wishlist, catalog } = useStore();
  const saved = wishlist
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product) => product !== undefined);

  return (
    <StoreShell>
      <header className="page-head has-aura">
        <div className="aura aura-gold" style={{ width: 400, height: 400, top: -170, right: -130 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">Your edit</p>
          <h1>
            Saved for <span className="accent">later.</span>
          </h1>
          <p className="lede">The pieces that caught your eye, kept in one place on this device.</p>
        </div>
      </header>

      <section className="container section-tight">
        {saved.length === 0 ? (
          <div className="empty-state">
            <span>♡</span>
            <h3>Nothing saved yet</h3>
            <p>Tap the heart on any product and it will wait for you here.</p>
            <Link href="/shop" className="btn">
              Explore the collection
            </Link>
          </div>
        ) : (
          <div className="product-grid">
            {saved.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </StoreShell>
  );
}
