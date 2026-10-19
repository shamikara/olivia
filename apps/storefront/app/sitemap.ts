import type { MetadataRoute } from "next";
import { getProducts } from "./lib/product-store";
import { CATEGORIES } from "./data/products";
import { absolute } from "./lib/seo";

/**
 * Generated from the live catalogue rather than hand-maintained, so a product
 * added in the admin panel is discoverable without anyone remembering to
 * update a list.
 */
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: absolute("/"), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: absolute("/shop"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absolute("/brands"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  const categoryPages: MetadataRoute.Sitemap = CATEGORIES.map((category) => ({
    url: absolute(`/shop?category=${encodeURIComponent(category.value)}`),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  let productPages: MetadataRoute.Sitemap = [];
  try {
    productPages = (await getProducts()).map((product) => ({
      url: absolute(`/product/${product.id}`),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    // A database hiccup should degrade the sitemap, not serve a 500 to a crawler.
  }

  return [...staticPages, ...categoryPages, ...productPages];
}
