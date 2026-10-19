import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "./lib/store";
import { SITE } from "./lib/site";
import { SITE_URL } from "./lib/seo";
import { getProducts } from "./lib/product-store";

export const metadata: Metadata = {
  /*
   * Required for Open Graph and canonical URLs to resolve absolutely —
   * without it Next emits relative URLs, which crawlers and social scrapers
   * cannot follow.
   */
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.name} — ${SITE.tagline} in Sri Lanka`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: SITE.name,
    locale: "en_LK",
    url: "/",
    title: `${SITE.name} — ${SITE.tagline} in Sri Lanka`,
    description: SITE.description,
    images: [{ url: SITE.logo, alt: SITE.name }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline} in Sri Lanka`,
    description: SITE.description,
    images: [SITE.logo],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

/*
 * The catalogue is editable from the admin panel, so pages are rendered per
 * request rather than baked in at build time. With a few dozen products the
 * cost is negligible, and stock levels stay truthful.
 */
export const dynamic = "force-dynamic";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf7f3",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Loaded once on the server so every page and the cart share one catalogue.
  const catalog = await getProducts();

  return (
    <html lang="en">
      <body>
        <StoreProvider catalog={catalog}>{children}</StoreProvider>
      </body>
    </html>
  );
}
