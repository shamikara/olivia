"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { NAV_LINKS } from "../lib/site";
import { useStore } from "../lib/store";
import { Wordmark } from "./Wordmark";
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "./Icons";

/**
 * Condenses once the page scrolls, and slides out of the way while the reader
 * moves down the page — returning the moment they scroll back up.
 */
const HIDE_BELOW = 260; // Never retreat while the hero is still in view.
const DIRECTION_THRESHOLD = 8; // Ignore scroll jitter and rubber-banding.
const SCROLLED_ON = 24;
const SCROLLED_OFF = 8;

function useHeaderScroll() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;
    let ticking = false;

    const update = () => {
      ticking = false;
      const y = Math.max(0, window.scrollY);
      const delta = y - lastY;

      // Separate on/off points, so hovering near the boundary can't oscillate.
      setScrolled((was) => (was ? y > SCROLLED_OFF : y > SCROLLED_ON));

      // Only commit a direction change once the reader has actually moved,
      // and move the baseline with it — comparing against a stale baseline is
      // what made the header flicker on every frame.
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return;
      setHidden(delta > 0 && y > HIDE_BELOW);
      lastY = y;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return { scrolled, hidden };
}

export function SiteHeader() {
  const { itemCount, wishlist, openCart, openNav, isCartOpen, isNavOpen } = useStore();
  const { scrolled, hidden } = useHeaderScroll();
  const [query, setQuery] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    router.push(query.trim() ? `/search?q=${encodeURIComponent(query.trim())}` : "/search");
  };

  return (
    <header
      className="site-header glass"
      data-scrolled={scrolled}
      data-hidden={hidden && !isCartOpen && !isNavOpen}
    >
      <div className="container header-inner">
        <button className="icon-btn nav-toggle" onClick={openNav} aria-label="Open menu">
          <MenuIcon />
        </button>

        <Wordmark />

        <nav className="header-nav" aria-label="Primary">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href.split("?")[0] ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <form className="header-search" onSubmit={submitSearch} role="search">
            <SearchIcon />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search skincare…"
              aria-label="Search products"
            />
          </form>

          <Link href="/search" className="icon-btn search-jump" aria-label="Search">
            <SearchIcon size={20} />
          </Link>

          <Link href="/account" className="icon-btn header-account" aria-label="My account">
            <UserIcon size={20} />
          </Link>

          <Link href="/wishlist" className="icon-btn header-wish" aria-label="Saved items">
            <HeartIcon size={20} />
            {wishlist.length > 0 && <span className="count-badge">{wishlist.length}</span>}
          </Link>

          <button className="icon-btn" onClick={openCart} aria-label={`Bag, ${itemCount} items`}>
            <BagIcon />
            {itemCount > 0 && <span className="count-badge">{itemCount}</span>}
          </button>
        </div>
      </div>
    </header>
  );
}
