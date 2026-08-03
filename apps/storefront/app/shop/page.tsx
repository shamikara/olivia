"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StoreShell } from "../components/StoreShell";
import { ProductCard } from "../components/ProductCard";
import { CATEGORIES, type Category } from "../data/products";
import { useStore } from "../lib/store";

type Sort = "featured" | "price-asc" | "price-desc" | "rating";

const SORTS: { value: Sort; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
];

function ShopCatalog() {
  const params = useSearchParams();
  const router = useRouter();

  const { catalog } = useStore();
  const category = params.get("category") as Category | null;
  const brand = params.get("brand");
  const [sort, setSort] = useState<Sort>("featured");

  const brands = useMemo(
    () => [...new Set(catalog.map((product) => product.brand))].sort(),
    [catalog],
  );

  const setFilter = (key: string, value: string | null) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    router.replace(next.toString() ? `/shop?${next}` : "/shop", { scroll: false });
  };

  const products = useMemo(() => {
    const filtered = catalog.filter(
      (product) => (!category || product.category === category) && (!brand || product.brand === brand),
    );

    switch (sort) {
      case "price-asc":
        return [...filtered].sort((a, b) => a.priceLKR - b.priceLKR);
      case "price-desc":
        return [...filtered].sort((a, b) => b.priceLKR - a.priceLKR);
      case "rating":
        return [...filtered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      default:
        return filtered;
    }
  }, [catalog, category, brand, sort]);

  const activeCategory = CATEGORIES.find((item) => item.value === category);

  return (
    <>
      <header className="page-head has-aura">
        <div className="aura aura-blush" style={{ width: 420, height: 420, top: -180, right: -120 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">The catalogue</p>
          <h1>{activeCategory ? activeCategory.label : (brand ?? "Everything we stock")}</h1>
          <p className="lede">
            {activeCategory
              ? `Our full ${activeCategory.label.toLowerCase()} shelf, chosen for humid Sri Lankan skin.`
              : "A deliberately short shelf. Every product here has been tested in this climate and sourced direct."}
          </p>
        </div>
      </header>

      <section className="section-tight">
        <div className="container">
          <div className="rail filter-rail">
            <button className="chip" aria-pressed={!category} onClick={() => setFilter("category", null)}>
              All products
            </button>
            {CATEGORIES.map((item) => (
              <button
                key={item.value}
                className="chip"
                aria-pressed={category === item.value}
                onClick={() => setFilter("category", item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="rail filter-rail">
            <button className="chip" aria-pressed={!brand} onClick={() => setFilter("brand", null)}>
              All brands
            </button>
            {brands.map((item) => (
              <button
                key={item}
                className="chip"
                aria-pressed={brand === item}
                onClick={() => setFilter("brand", item)}
              >
                {item}
              </button>
            ))}
          </div>

          <div className="catalog-bar">
            <span className="mono muted">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>

            <label className="sort-control">
              <span className="mono muted">Sort</span>
              <select className="chip" value={sort} onChange={(event) => setSort(event.target.value as Sort)}>
                {SORTS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {products.length === 0 ? (
            <div className="empty-state">
              <span>✦</span>
              <h3>Nothing matches those filters</h3>
              <p>Try widening your selection — the whole shelf is only twelve products deep.</p>
              <button className="btn" onClick={() => router.replace("/shop", { scroll: false })}>
                Reset filters
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function ShopPage() {
  return (
    <StoreShell>
      <Suspense fallback={<div className="section container muted">Loading the shelf…</div>}>
        <ShopCatalog />
      </Suspense>
    </StoreShell>
  );
}
