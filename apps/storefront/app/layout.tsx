import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "./lib/store";
import { SITE } from "./lib/site";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline} in Sri Lanka`,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#faf7f3",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
