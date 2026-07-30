import Link from "next/link";
import { StoreShell } from "./components/StoreShell";
import { ProductCard } from "./components/ProductCard";
import { NewsletterForm } from "./components/NewsletterForm";
import { HeroSlideshow } from "./components/HeroSlideshow";
import { PRODUCTS_CATALOG, FEATURED_BRANDS, SKIN_GOALS } from "./data/products";
import { SITE } from "./lib/site";

const REVIEWS = [
  {
    quote: "Ordered on Tuesday, had it in Kandy by Thursday. The Relief Sun is the first sunscreen I have finished to the last drop.",
    name: "Dilhani P.",
    detail: "Kandy · Verified buyer",
  },
  {
    quote: "They asked about my skin on WhatsApp before letting me buy the wrong thing. My barrier has genuinely recovered.",
    name: "Nethmi R.",
    detail: "Colombo 05 · Verified buyer",
  },
  {
    quote: "The AGE-R device felt like a lot until I split it over three months. Six weeks in and my jawline is sharper.",
    name: "Sanduni F.",
    detail: "Negombo · Verified buyer",
  },
];

const TRUST = [
  { title: "100% authentic", copy: "Sourced direct from Korea, never grey market" },
  { title: "Islandwide delivery", copy: "1–3 working days, cash on delivery available" },
  { title: "Pay in 3", copy: "Interest-free with Mintpay, Koko & Payzy" },
  { title: "Free consultation", copy: "A real advisor on WhatsApp before you buy" },
];

export default function Home() {
  const bestsellers = PRODUCTS_CATALOG.filter((product) => product.bestseller).slice(0, 4);
  const newIn = PRODUCTS_CATALOG.filter((product) => !product.bestseller).slice(0, 8);

  return (
    <StoreShell>
      {/* Hero */}
      <section className="hero">
        <HeroSlideshow />
        <div className="container hero-inner">
          <div className="hero-copy">
            <p className="eyebrow">Sri Lanka&apos;s K-Beauty house</p>
            <h1>
              Skin that looks <span className="accent">lit from within.</span>
            </h1>
            <p className="lede">
              Authentic Korean skincare, clinical beauty devices and barrier-repair rituals — chosen for humid,
              sun-exposed skin, and delivered to your door across the island.
            </p>

            <div className="hero-actions">
              <Link href="/shop" className="btn">
                Shop the edit
              </Link>
              <a className="btn btn-ghost" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
                Free skin consultation
              </a>
            </div>

            <div className="hero-badge">
              <b>3×</b>
              <small>Split any order into three interest-free monthly payments with Mintpay, Koko &amp; Payzy.</small>
            </div>

            <div className="hero-stats">
              <div>
                <b>4.9★</b>
                <small>Average rating</small>
              </div>
              <div>
                <b>6</b>
                <small>Curated brands</small>
              </div>
              <div>
                <b>1–3 days</b>
                <small>Islandwide delivery</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="trust">
        <div className="container trust-grid">
          {TRUST.map((item) => (
            <div key={item.title}>
              <b>{item.title}</b>
              <small>{item.copy}</small>
            </div>
          ))}
        </div>
      </section>

      {/* Brand rail */}
      <section className="brand-strip">
        <div className="container brand-strip-inner">
          <span className="brand-strip-label">Stocked brands</span>
          <div className="rail">
            {FEATURED_BRANDS.map((brand) => (
              <Link key={brand.name} href={`/shop?brand=${encodeURIComponent(brand.name)}`} className="chip">
                {brand.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by skin goal */}
      <section className="section has-aura">
        <div className="aura aura-blush" style={{ width: 400, height: 400, top: 20, right: -180 }} />
        <div className="container reveal">
          <div className="section-head">
            <div>
              <p className="eyebrow">Targeted results</p>
              <h2>
                Shop by <span className="accent">skin goal</span>
              </h2>
            </div>
            <p className="lede">
              Not sure where to start? Choose the outcome you want and we&apos;ll narrow the shelf down for you.
            </p>
          </div>

          <div className="goal-grid">
            {SKIN_GOALS.map((goal) => (
              <Link key={goal.title} href={`/shop?category=${goal.category}`} className="goal-card">
                <i aria-hidden="true">{goal.icon}</i>
                <b>{goal.title}</b>
                <small>{goal.copy}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Bestsellers */}
      <section className="section-tight has-aura">
        <div className="aura aura-gold" style={{ width: 460, height: 460, bottom: -220, left: -160 }} />
        <div className="container reveal">
          <div className="section-head">
            <div>
              <p className="eyebrow">Loved by our customers</p>
              <h2>
                The <span className="accent">bestsellers</span>
              </h2>
            </div>
            <Link href="/shop" className="link-underline">
              View all products →
            </Link>
          </div>

          <div className="product-grid">
            {bestsellers.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Story split */}
      <section className="split" id="story">
        <div className="split-media">
          <img src="/images/olivia-hero.png" alt="Olivia Glow founder ritual" />
        </div>
        <div className="split-copy reveal">
          <p className="eyebrow">Our promise</p>
          <h2>
            Every formula earns its place on <span className="accent">your shelf.</span>
          </h2>
          <p className="lede">
            We buy direct, we test in this climate, and we say no to most of what we&apos;re offered. What&apos;s left is
            a short shelf of products we would put on our own skin — and the honest advice to tell you which two you
            actually need.
          </p>

          <div className="value-row">
            <div>
              <b>Sourced direct</b>
              <small>No grey-market stock, ever</small>
            </div>
            <div>
              <b>Climate tested</b>
              <small>Textures that work in humidity</small>
            </div>
            <div>
              <b>Honest advice</b>
              <small>We&apos;ll talk you out of the wrong buy</small>
            </div>
          </div>
        </div>
      </section>

      {/* New arrivals */}
      <section className="section">
        <div className="container reveal">
          <div className="section-head">
            <div>
              <p className="eyebrow">Fresh on the shelf</p>
              <h2>
                New <span className="accent">arrivals</span>
              </h2>
            </div>
            <Link href="/shop" className="link-underline">
              Browse the full catalogue →
            </Link>
          </div>

          <div className="product-grid">
            {newIn.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="section-tight has-aura">
        <div className="aura aura-blush" style={{ width: 420, height: 420, top: -120, right: -140 }} />
        <div className="container reveal">
          <div className="section-head">
            <div>
              <p className="eyebrow">Real routines</p>
              <h2>
                What people <span className="accent">tell us.</span>
              </h2>
            </div>
          </div>

          <div className="review-grid">
            {REVIEWS.map((review) => (
              <article className="review-card" key={review.name}>
                <span className="stars" aria-hidden="true">
                  ★★★★★
                </span>
                <blockquote>&ldquo;{review.quote}&rdquo;</blockquote>
                <footer>
                  <b>{review.name}</b> · {review.detail}
                </footer>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp CTA */}
      <section className="section-tight">
        <div className="container reveal">
          <div className="cta-banner">
            <p className="eyebrow">Free skincare advisory</p>
            <h2>Not sure what your skin needs?</h2>
            <p>
              Send us a photo and a few details on WhatsApp. Our Colombo advisors will build you a routine from what we
              actually stock — and tell you honestly if you don&apos;t need a third serum.
            </p>
            <a className="btn btn-whatsapp" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter">
        <div className="container newsletter-inner reveal">
          <div>
            <p className="eyebrow">Stay in the glow</p>
            <h2>
              10% off your <span className="accent">first order.</span>
            </h2>
          </div>
          <NewsletterForm />
        </div>
      </section>
    </StoreShell>
  );
}
