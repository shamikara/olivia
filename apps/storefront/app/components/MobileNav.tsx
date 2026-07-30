"use client";

import Link from "next/link";
import { CATEGORIES } from "../data/products";
import { SITE } from "../lib/site";
import { useStore } from "../lib/store";
import { Wordmark } from "./Wordmark";
import { CloseIcon } from "./Icons";

export function MobileNav() {
  const { isNavOpen, closeNav } = useStore();
  if (!isNavOpen) return null;

  return (
    <div className="overlay" onClick={closeNav} role="presentation">
      <aside
        className="panel panel-left"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Site menu"
      >
        <div className="panel-head">
          <Wordmark showTagline={false} />
          <button className="icon-btn" onClick={closeNav} aria-label="Close menu">
            <CloseIcon />
          </button>
        </div>

        <div className="panel-body">
          <div className="nav-group">
            <h3>Shop</h3>
            <Link href="/shop" onClick={closeNav}>
              All products <span className="meta">→</span>
            </Link>
            {CATEGORIES.map((category) => (
              <Link key={category.value} href={`/shop?category=${category.value}`} onClick={closeNav}>
                {category.label} <span className="meta">→</span>
              </Link>
            ))}
          </div>

          <div className="nav-group">
            <h3>Discover</h3>
            <Link href="/brands" onClick={closeNav}>
              Brands <span className="meta">→</span>
            </Link>
            <Link href="/search" onClick={closeNav}>
              Search <span className="meta">→</span>
            </Link>
            <Link href="/wishlist" onClick={closeNav}>
              Saved edit <span className="meta">→</span>
            </Link>
            <Link href="/cart" onClick={closeNav}>
              Your bag <span className="meta">→</span>
            </Link>
          </div>

          <div className="nav-group">
            <h3>Talk to us</h3>
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" onClick={closeNav}>
              WhatsApp advice <span className="meta">↗</span>
            </a>
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer" onClick={closeNav}>
              Instagram <span className="meta">↗</span>
            </a>
            <a href={SITE.tiktok} target="_blank" rel="noopener noreferrer" onClick={closeNav}>
              TikTok <span className="meta">↗</span>
            </a>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer" onClick={closeNav}>
              Facebook <span className="meta">↗</span>
            </a>
          </div>
        </div>

        <div className="panel-foot">
          <a className="btn btn-whatsapp btn-block" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
            Free skin consultation
          </a>
        </div>
      </aside>
    </div>
  );
}
