import Link from "next/link";
import type { Metadata } from "next";
import { StoreShell } from "../components/StoreShell";
import { FEATURED_BRANDS, PRODUCTS_CATALOG } from "../data/products";

export const metadata: Metadata = {
  title: "Brands",
  description: "The six houses we stock — Medicube, Olivia Glow, Beauty of Joseon, Anua, COSRX and Skin1004.",
};

export default function BrandsPage() {
  return (
    <StoreShell>
      <header className="page-head has-aura">
        <div className="aura aura-gold" style={{ width: 440, height: 440, top: -190, right: -150 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">The Olivia edit</p>
          <h1>
            Brands with <span className="accent">beautiful standards.</span>
          </h1>
          <p className="lede">
            We only make room for houses that earn their place on your shelf. Six of them, sourced direct, with no
            grey-market stock in between.
          </p>
        </div>
      </header>

      <section className="container section-tight">
        <div className="brand-grid">
          {FEATURED_BRANDS.map((brand) => {
            const count = PRODUCTS_CATALOG.filter((product) => product.brand === brand.name).length;
            return (
              <Link key={brand.name} href={`/shop?brand=${encodeURIComponent(brand.name)}`} className="brand-card">
                <div className="brand-mark" aria-hidden="true">
                  {brand.initials}
                </div>
                <p className="eyebrow eyebrow-muted">
                  {count} {count === 1 ? "product" : "products"}
                </p>
                <h3 style={{ marginBottom: 8 }}>{brand.name}</h3>
                <p className="muted" style={{ fontSize: "0.82rem", lineHeight: 1.6 }}>
                  {brand.blurb}
                </p>
                <span className="link-underline" style={{ marginTop: 16 }}>
                  Shop the brand →
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </StoreShell>
  );
}
