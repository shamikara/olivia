"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { StoreShell } from "../components/StoreShell";
import { CloseIcon } from "../components/Icons";
import { CATEGORIES, discountPercent, formatLKR, type BeautyProduct } from "../data/products";
import { useStore } from "../lib/store";

/**
 * A row of the comparison table.
 *
 * `key` is the plain-text value the row is judged identical by, and is kept
 * separate from `render` so the formatted cell can carry markup — a price with
 * its discount badge, a list of benefits — without that markup deciding
 * whether two products actually differ.
 */
interface Row {
  label: string;
  key: (product: BeautyProduct) => string;
  render: (product: BeautyProduct) => ReactNode;
}

const DASH = <span className="compare-none">—</span>;

const categoryLabel = (product: BeautyProduct) =>
  CATEGORIES.find((item) => item.value === product.category)?.label ?? product.category;

const bullets = (items: string[] | undefined) =>
  items?.length ? (
    <ul className="compare-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  ) : (
    DASH
  );

/*
 * Ordered by what actually decides a skincare purchase: what it costs, then
 * what is in it, then how it is used. Brand and category sit near the top
 * because this catalogue carries several near-identical products per brand.
 */
const ROWS: Row[] = [
  {
    label: "Price",
    key: (product) => String(product.priceLKR),
    render: (product) => {
      const discount = discountPercent(product);
      return (
        <div className="compare-price">
          <strong>{formatLKR(product.priceLKR)}</strong>
          {product.originalPriceLKR && (
            <span>
              <s>{formatLKR(product.originalPriceLKR)}</s> −{discount}%
            </span>
          )}
        </div>
      );
    },
  },
  {
    label: "Brand",
    key: (product) => product.brand,
    render: (product) => product.brand,
  },
  {
    label: "Category",
    key: categoryLabel,
    render: categoryLabel,
  },
  {
    label: "Size",
    key: (product) => product.size ?? "",
    render: (product) => product.size ?? DASH,
  },
  {
    label: "Rating",
    key: (product) => (product.rating === undefined ? "" : String(product.rating)),
    render: (product) =>
      product.rating === undefined ? (
        DASH
      ) : (
        <>
          ★ {product.rating}
          {product.reviewsCount ? ` · ${product.reviewsCount} reviews` : ""}
        </>
      ),
  },
  {
    label: "Key ingredients",
    key: (product) => product.keyIngredients ?? "",
    render: (product) => product.keyIngredients ?? DASH,
  },
  {
    label: "Targets",
    key: (product) => (product.concerns ?? []).join(" · "),
    render: (product) => bullets(product.concerns),
  },
  {
    label: "Benefits",
    key: (product) => product.benefits.join(" · "),
    render: (product) => bullets(product.benefits),
  },
  {
    label: "How to use",
    key: (product) => product.howToUse ?? "",
    render: (product) => product.howToUse ?? DASH,
  },
  {
    label: "Availability",
    key: (product) =>
      product.stockCount === 0 ? "out" : product.stockCount <= 5 ? "low" : "in",
    render: (product) =>
      product.stockCount === 0 ? (
        <span className="compare-out">Out of stock</span>
      ) : product.stockCount <= 5 ? (
        `Only ${product.stockCount} left`
      ) : (
        "In stock"
      ),
  },
];

export function CompareTable() {
  const { catalog, compare, toggleCompare, clearCompare, addToCart } = useStore();
  const [differencesOnly, setDifferencesOnly] = useState(false);

  const products = compare
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is BeautyProduct => product !== undefined);

  if (products.length < 2) {
    return (
      <StoreShell>
        <header className="page-head has-aura">
          <div className="aura aura-gold" style={{ width: 400, height: 400, top: -170, right: -130 }} />
          <div className="container" style={{ position: "relative", zIndex: 1 }}>
            <p className="eyebrow">Side by side</p>
            <h1>
              Compare before you <span className="accent">commit.</span>
            </h1>
          </div>
        </header>

        <section className="container section-tight">
          <div className="empty-state">
            <span>⇄</span>
            <h3>{products.length === 0 ? "Nothing to compare yet" : "Pick one more"}</h3>
            <p>
              {products.length === 0
                ? "Tap the compare arrows on any product and it will line up here beside the next one."
                : "A comparison needs two. Add another product and the table will fill in."}
            </p>
            <Link href="/shop" className="btn">
              Browse the catalogue
            </Link>
          </div>
        </section>
      </StoreShell>
    );
  }

  /*
   * A row is "shared" when every product gives the same answer. With a shelf
   * this uniform — six capsule creams that differ by one active — the rows
   * that differ are the entire point, so they can be isolated.
   */
  const differs = (row: Row) => new Set(products.map(row.key)).size > 1;
  const rows = differencesOnly ? ROWS.filter(differs) : ROWS;
  const sharedCount = ROWS.length - ROWS.filter(differs).length;

  return (
    <StoreShell>
      <header className="page-head has-aura">
        <div className="aura aura-gold" style={{ width: 400, height: 400, top: -170, right: -130 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">Side by side</p>
          <h1>
            Compare before you <span className="accent">commit.</span>
          </h1>
          <p className="lede">
            {products.length} products, matched row for row. Rows where they differ are marked.
          </p>
        </div>
      </header>

      <section className="container section-tight">
        <div className="compare-toolbar">
          <button
            className="chip"
            aria-pressed={differencesOnly}
            onClick={() => setDifferencesOnly((on) => !on)}
            disabled={sharedCount === 0}
          >
            Show only differences
          </button>
          <span className="muted">
            {sharedCount === 0
              ? "Every row differs"
              : `${sharedCount} of ${ROWS.length} rows are identical`}
          </span>
          <button className="compare-clear-all link-underline" onClick={clearCompare}>
            Clear all
          </button>
        </div>

        <div className="compare-scroll">
          <table className="compare-table" style={{ "--cols": products.length } as React.CSSProperties}>
            <caption className="sr-only">
              Comparison of {products.map((product) => product.name).join(", ")}
            </caption>

            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Feature</span>
                </th>
                {products.map((product) => (
                  <th scope="col" key={product.id}>
                    <div className="compare-head">
                      <button
                        className="compare-remove"
                        onClick={() => toggleCompare(product.id)}
                        aria-label={`Remove ${product.shortName} from compare`}
                      >
                        <CloseIcon size={14} />
                      </button>
                      <Link href={`/product/${product.id}`}>
                        <img src={product.image} alt="" loading="lazy" />
                      </Link>
                      <span className="compare-brand">{product.brand}</span>
                      <Link href={`/product/${product.id}`} className="compare-name">
                        {product.shortName}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {/* Two near-duplicate entries can match on every row, which would
                  otherwise filter down to an empty table with no explanation. */}
              {rows.length === 0 && (
                <tr>
                  <th scope="row">
                    <span className="sr-only">Result</span>
                  </th>
                  <td colSpan={products.length}>
                    These products are identical on every row compared.
                  </td>
                </tr>
              )}

              {rows.map((row) => (
                <tr key={row.label} data-differs={differs(row) ? "true" : undefined}>
                  <th scope="row">{row.label}</th>
                  {products.map((product) => (
                    <td key={product.id}>{row.render(product)}</td>
                  ))}
                </tr>
              ))}
            </tbody>

            <tfoot>
              <tr>
                <th scope="row">
                  <span className="sr-only">Add to bag</span>
                </th>
                {products.map((product) => (
                  <td key={product.id}>
                    <button
                      className="btn btn-sm btn-block"
                      onClick={() => addToCart(product.id)}
                      disabled={product.stockCount === 0}
                    >
                      {product.stockCount === 0 ? "Sold out" : "Add to bag"}
                    </button>
                  </td>
                ))}
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </StoreShell>
  );
}
