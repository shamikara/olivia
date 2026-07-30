"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { StoreShell } from "../components/StoreShell";
import { ProductCard } from "../components/ProductCard";
import { SearchIcon } from "../components/Icons";
import { PRODUCTS_CATALOG } from "../data/products";

const SUGGESTIONS = ["Sunscreen", "Barrier repair", "Snail mucin", "Acne", "Glass skin", "Medicube"];

function SearchExperience() {
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  const results = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return PRODUCTS_CATALOG;

    return PRODUCTS_CATALOG.filter((product) =>
      [product.name, product.brand, product.category, product.description, ...product.concerns, ...product.benefits]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [query]);

  return (
    <>
      <header className="page-head has-aura">
        <div className="aura aura-blush" style={{ width: 420, height: 420, top: -180, left: -140 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">Discover</p>
          <h1>
            Find your next <span className="accent">favourite.</span>
          </h1>

          <div className="search-field">
            <SearchIcon size={20} />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search products, concerns, ingredients…"
              aria-label="Search products"
            />
            {query && (
              <button className="chip" onClick={() => setQuery("")}>
                Clear
              </button>
            )}
          </div>

          <div className="rail" style={{ marginTop: 18 }}>
            {SUGGESTIONS.map((suggestion) => (
              <button key={suggestion} className="chip" onClick={() => setQuery(suggestion)}>
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="container section-tight">
        <p className="mono muted" style={{ fontSize: "0.7rem", letterSpacing: "0.12em", marginBottom: 22 }}>
          {results.length} {results.length === 1 ? "RESULT" : "RESULTS"}
          {query.trim() && ` FOR “${query.trim().toUpperCase()}”`}
        </p>

        {results.length === 0 ? (
          <div className="empty-state">
            <span>✦</span>
            <h3>No matches for that search</h3>
            <p>Try a concern like &ldquo;redness&rdquo;, or message us on WhatsApp and we&apos;ll find it for you.</p>
            <button className="btn" onClick={() => setQuery("")}>
              Show everything
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default function SearchPage() {
  return (
    <StoreShell>
      <Suspense fallback={<div className="section container muted">Loading search…</div>}>
        <SearchExperience />
      </Suspense>
    </StoreShell>
  );
}
