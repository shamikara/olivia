import type { ReactNode } from "react";
import { AnnouncementBar } from "./AnnouncementBar";
import { CartDrawer } from "./CartDrawer";
import { MobileNav } from "./MobileNav";
import { QuickView } from "./QuickView";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { SmoothScroll } from "./SmoothScroll";
import { TabBar } from "./TabBar";
import { Toast } from "./Toast";

/** Wraps every storefront page in the shared chrome: announcement, header, footer and overlays. */
export function StoreShell({ children }: { children: ReactNode }) {
  return (
    <div className="storefront">
      <SmoothScroll />
      <AnnouncementBar />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <TabBar />
      <MobileNav />
      <CartDrawer />
      <QuickView />
      <Toast />
    </div>
  );
}
