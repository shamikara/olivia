"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SITE } from "../lib/site";
import { useStore } from "../lib/store";
import { BagIcon, ChatIcon, GridIcon, HomeIcon } from "./Icons";

export function TabBar() {
  const { itemCount, openCart } = useStore();
  const pathname = usePathname();

  return (
    <nav className="tabbar glass" aria-label="Quick navigation">
      <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
        <HomeIcon />
        <span>Home</span>
      </Link>
      <Link href="/shop" aria-current={pathname === "/shop" ? "page" : undefined}>
        <GridIcon />
        <span>Shop</span>
      </Link>
      <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
        <ChatIcon />
        <span>Advice</span>
      </a>
      <button onClick={openCart} aria-label={`Open bag, ${itemCount} items`}>
        <BagIcon />
        <span>Bag</span>
        {itemCount > 0 && <span className="count-badge">{itemCount}</span>}
      </button>
    </nav>
  );
}
