import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "./lib/store";
import { SITE } from "./lib/site";
import { getProducts } from "./lib/product-store";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline} in Sri Lanka`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
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
