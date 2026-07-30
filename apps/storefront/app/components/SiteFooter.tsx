import Link from "next/link";
import { CATEGORIES } from "../data/products";
import { SITE } from "../lib/site";
import { Wordmark } from "./Wordmark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark />
            <p>{SITE.description}</p>
          </div>

          <div className="footer-col">
            <h4>Shop</h4>
            <Link href="/shop">All products</Link>
            {CATEGORIES.map((category) => (
              <Link key={category.value} href={`/shop?category=${category.value}`}>
                {category.label}
              </Link>
            ))}
          </div>

          <div className="footer-col">
            <h4>Follow along</h4>
            <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
              WhatsApp advice
            </a>
            <a href={SITE.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
            <a href={SITE.tiktok} target="_blank" rel="noopener noreferrer">
              TikTok
            </a>
            <a href={SITE.facebook} target="_blank" rel="noopener noreferrer">
              Facebook
            </a>
          </div>

          <div className="footer-col">
            <h4>Pay your way</h4>
            <p>Split any order into 3 interest-free monthly payments, or pay cash when it arrives.</p>
            <div className="footer-pay">
              <span>Mintpay</span>
              <span>Koko</span>
              <span>Payzy</span>
              <span>Cash on delivery</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Olivia Glow · Colombo, Sri Lanka</span>
          <span>100% authentic K-Beauty, sourced direct</span>
        </div>
      </div>
    </footer>
  );
}
