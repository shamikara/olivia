import type { MetadataRoute } from "next";
import { absolute } from "./lib/seo";

/**
 * Crawl rules.
 *
 * Everything behind a sign-in, everything mid-purchase, and the admin panel
 * are kept out of the index: they are useless as search results, and an
 * indexed order page is a privacy problem rather than a ranking one.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/admin/", "/account", "/account/", "/checkout", "/cart", "/order/", "/api/"],
    },
    sitemap: absolute("/sitemap.xml"),
    host: absolute(""),
  };
}
