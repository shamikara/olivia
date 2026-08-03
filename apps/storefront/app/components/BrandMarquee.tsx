import Link from "next/link";
import { FEATURED_BRANDS, type Brand } from "../data/products";
import { getProducts } from "../lib/product-store";

/**
 * Continuously scrolling wall of stocked brands.
 *
 * The list is rendered twice so the track can loop seamlessly at -50%. Brands
 * with a `logo` file show it; the rest fall back to a typographic wordmark so
 * the wall stays visually uniform while official assets are collected.
 */
export async function BrandMarquee() {
  // Brands come from whatever is actually stocked, so adding a product in the
  // admin panel puts its brand on the wall automatically.
  const catalog = await getProducts();
  const stocked = [...new Set(catalog.map((product) => product.brand))].sort();
  const known = new Map(FEATURED_BRANDS.map((brand) => [brand.name, brand]));
  const brands: Brand[] = stocked.map(
    (name) => known.get(name) ?? { name, initials: name.slice(0, 2).toUpperCase(), blurb: "" },
  );

  const lane = [...brands, ...brands];

  return (
    <section className="brand-wall" aria-labelledby="brand-wall-title">
      <div className="container">
        <div className="brand-wall-head">
          <p className="eyebrow">Stocked at Olivia Glow</p>
          <h2 id="brand-wall-title">
            Unlock top <span className="accent">skincare brands</span>
          </h2>
        </div>
      </div>

      <div className="brand-marquee">
        <div className="brand-marquee-track">
          {lane.map((brand, position) => (
            <Link
              key={`${brand.name}-${position}`}
              href={`/shop?brand=${encodeURIComponent(brand.name)}`}
              className="brand-plate"
              // The second lane is a visual duplicate, so keep it off the tab
              // order and out of the accessibility tree.
              aria-hidden={position >= brands.length}
              tabIndex={position >= brands.length ? -1 : undefined}
            >
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} loading="lazy" />
              ) : (
                <span className="brand-plate-word">{brand.name}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
