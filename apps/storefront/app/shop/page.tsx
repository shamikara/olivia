import type { Metadata } from "next";
import { absolute } from "../lib/seo";
import { ShopBrowser } from "./ShopBrowser";

/**
 * Server wrapper for metadata. The browsing UI is a client component and
 * cannot export generateMetadata itself.
 *
 * Filters arrive as query strings, so the title reflects what is actually
 * being browsed — "Serums" rather than one generic "Shop" for every
 * combination of category and brand.
 */

type Params = { searchParams: Promise<{ category?: string; brand?: string }> };

export async function generateMetadata({ searchParams }: Params): Promise<Metadata> {
  const { category, brand } = await searchParams;

  const what = brand ? brand : category ? category.toLowerCase() : null;
  const title = brand
    ? `${brand} in Sri Lanka`
    : category
      ? `${category.charAt(0) + category.slice(1).toLowerCase()} — Shop`
      : "Shop all";

  const description = what
    ? `Shop authentic ${what} at Olivia Glow. Islandwide delivery, cash on delivery, and pay in 3 interest-free instalments.`
    : "Browse authentic Korean skincare, clinical beauty devices and barrier-repair rituals. Islandwide delivery across Sri Lanka.";

  /*
   * Filtered views canonicalise to /shop. They are the same catalogue sliced
   * differently, and letting each combination be indexed separately is how a
   * small shop ends up competing with itself.
   */
  return {
    title,
    description,
    alternates: { canonical: absolute("/shop") },
    openGraph: { type: "website", url: absolute("/shop"), title, description },
  };
}

export default function ShopPage() {
  return <ShopBrowser />;
}
