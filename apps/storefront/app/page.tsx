"use client";

import { useState, useMemo } from "react";
import { PRODUCTS_CATALOG, CATEGORIES, FEATURED_BRANDS, BeautyProduct, formatLKR, calculateInstallment } from "./data/products";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedBrand, setSelectedBrand] = useState<string>("ALL");
  const [cart, setCart] = useState<BeautyProduct[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<BeautyProduct | null>(null);

  const filteredProducts = useMemo(() => {
    return PRODUCTS_CATALOG.filter((product) => {
      const matchCat = selectedCategory === "ALL" || product.category.toUpperCase() === selectedCategory.toUpperCase();
      const matchBrand = selectedBrand === "ALL" || product.brand.toLowerCase() === selectedBrand.toLowerCase();
      const matchSearch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchBrand && matchSearch;
    });
  }, [selectedCategory, selectedBrand, searchQuery]);

  const addToCart = (product: BeautyProduct) => {
    setCart((prev) => [...prev, product]);
    setIsDrawerOpen(true);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.priceLKR, 0);

  return (
    <main className="luxury-storefront-root">
      {/* 1. Top Announcement Bar */}
      <div className="announcement-bar">
        <div className="announcement-inner">
          <span>Islandwide Express Courier • Orders Over LKR 15,000 Ship Free</span>
          <span className="dot-sep">•</span>
          <span>3-Month Installments via Koko & Mintpay</span>
        </div>
      </div>

      {/* 2. Glassmorphic Responsive Luxury Header */}
      <header className="glass-header">
        <div className="header-container">
          {/* Mobile Hamburger Toggle */}
          <button className="mobile-menu-trigger" onClick={() => setIsMobileMenuOpen(true)} aria-label="Toggle Mobile Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="4" x2="20" y1="6" y2="6"/>
              <line x1="4" x2="20" y1="12" y2="12"/>
              <line x1="4" x2="20" y1="18" y2="18"/>
            </svg>
          </button>

          {/* Logo */}
          <a className="brand-logo" href="/">
            <img src="/images/olivia-glow-logo.jpeg" alt="Olivia Glow Logo" className="logo-badge" />
            <div className="brand-text">
              <span className="brand-name">OLIVIA <em>GLOW</em></span>
              <span className="brand-subtitle">LUXURY BEAUTY</span>
            </div>
          </a>

          {/* Desktop Navigation Menu */}
          <nav className="header-menu">
            <button className={`menu-link ${selectedCategory === "ALL" ? "active" : ""}`} onClick={() => setSelectedCategory("ALL")}>Catalog</button>
            <button className={`menu-link ${selectedCategory === "SERUM" ? "active" : ""}`} onClick={() => setSelectedCategory("SERUM")}>Serums</button>
            <button className={`menu-link ${selectedCategory === "MOISTURIZERS" ? "active" : ""}`} onClick={() => setSelectedCategory("MOISTURIZERS")}>Moisturizers</button>
            <button className={`menu-link ${selectedCategory === "DEVICE" ? "active" : ""}`} onClick={() => setSelectedCategory("DEVICE")}>Beauty Tech</button>
            <button className={`menu-link ${selectedCategory === "SUN CREAM" ? "active" : ""}`} onClick={() => setSelectedCategory("SUN CREAM")}>Sun Care</button>
          </nav>

          {/* Header Action Tools */}
          <div className="header-actions">
            <div className="search-bar">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search formulas..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && <button className="clear-search" onClick={() => setSearchQuery("")}>✕</button>}
            </div>

            <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="wa-consult-btn" title="WhatsApp Consultation">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="hide-mobile">Consultation</span>
            </a>

            <button className="bag-button" onClick={() => setIsDrawerOpen(true)} aria-label="Shopping Bag">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              <span className="bag-text hide-mobile">Bag</span>
              {cart.length > 0 && <span className="bag-badge">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Off-Canvas Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-overlay" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-head">
              <div className="brand-logo">
                <img src="/images/olivia-glow-logo.jpeg" alt="Olivia Glow Logo" className="logo-badge" />
                <span className="brand-name">OLIVIA <em>GLOW</em></span>
              </div>
              <button className="close-drawer" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
            </div>

            <div className="mobile-drawer-body">
              <div className="mobile-search-box">
                <input type="text" placeholder="Search skincare..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              <div className="mobile-nav-links">
                <span className="drawer-subhead">COLLECTIONS</span>
                <button className={`m-link ${selectedCategory === "ALL" ? "active" : ""}`} onClick={() => { setSelectedCategory("ALL"); setIsMobileMenuOpen(false); }}>All Formulas</button>
                <button className={`m-link ${selectedCategory === "SERUM" ? "active" : ""}`} onClick={() => { setSelectedCategory("SERUM"); setIsMobileMenuOpen(false); }}>Serums & Oils</button>
                <button className={`m-link ${selectedCategory === "MOISTURIZERS" ? "active" : ""}`} onClick={() => { setSelectedCategory("MOISTURIZERS"); setIsMobileMenuOpen(false); }}>Moisturizers</button>
                <button className={`m-link ${selectedCategory === "DEVICE" ? "active" : ""}`} onClick={() => { setSelectedCategory("DEVICE"); setIsMobileMenuOpen(false); }}>Beauty Tech</button>
                <button className={`m-link ${selectedCategory === "SUN CREAM" ? "active" : ""}`} onClick={() => { setSelectedCategory("SUN CREAM"); setIsMobileMenuOpen(false); }}>Sun Care</button>
              </div>

              <div className="mobile-nav-links">
                <span className="drawer-subhead">SOCIAL CHANNELS</span>
                <a href="https://www.instagram.com/oliviaglow.lk?utm_source=qr" target="_blank" rel="noopener noreferrer" className="m-link">Instagram (@oliviaglow.lk)</a>
                <a href="https://www.tiktok.com/@oliviaglow41?_r=1&_t=ZS-98MOQHA4s9l" target="_blank" rel="noopener noreferrer" className="m-link">TikTok (@oliviaglow41)</a>
                <a href="https://www.facebook.com/share/1DB3Bx18WX/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="m-link">Facebook Page</a>
              </div>

              <div className="mobile-drawer-footer">
                <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="m-wa-btn">
                  💬 Chat on WhatsApp
                </a>
                <a href="/admin" className="m-admin-link">Admin Portal</a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 4. Magazine Editorial Hero Section */}
      <section className="hero-editorial">
        <div className="hero-grid">
          <div className="hero-content">
            <span className="hero-eyebrow">THE 2026 RADIANCE CAMPAIGN</span>
            <h1>The Art of<br /><i>Luminous Skin.</i></h1>
            <p className="hero-desc">
              Consciously crafted barrier rituals and clinical K-Beauty essentials designed for effortless, everyday glow.
            </p>
            <div className="hero-buttons">
              <a href="#catalog" className="btn-solid">Explore Collection</a>
              <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="btn-text">
                Book Consultation <span>→</span>
              </a>
            </div>
          </div>
          <div className="hero-media">
            <div className="image-frame">
              <img src="/images/hero_cover.png" alt="Olivia Glow Luxury Campaign" />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Brand Strip */}
      <section className="brand-strip">
        <div className="content-container">
          <span className="strip-title">CURATED HOUSES:</span>
          <div className="brand-pills">
            <button className={`brand-btn ${selectedBrand === "ALL" ? "active" : ""}`} onClick={() => setSelectedBrand("ALL")}>All Houses</button>
            {FEATURED_BRANDS.map((b) => (
              <button key={b.name} className={`brand-btn ${selectedBrand === b.name ? "active" : ""}`} onClick={() => setSelectedBrand(b.name)}>
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Catalog Grid */}
      <section className="catalog-section" id="catalog">
        <div className="content-container">
          <div className="section-head">
            <div>
              <span className="sub-eyebrow">FORMULATED FOR PERFECTION</span>
              <h2>The Skincare <i>Collection</i></h2>
            </div>
            <div className="bnpl-note">
              Pay in 3 monthly installments with <strong>Mintpay, Koko & Payzy</strong>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="filter-tabs">
            <button className={`filter-tab ${selectedCategory === "ALL" ? "active" : ""}`} onClick={() => setSelectedCategory("ALL")}>All Rituals</button>
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`filter-tab ${selectedCategory === cat ? "active" : ""}`} onClick={() => setSelectedCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <p>No formulas match your criteria.</p>
              <button onClick={() => { setSelectedCategory("ALL"); setSelectedBrand("ALL"); setSearchQuery(""); }}>Reset Filters</button>
            </div>
          ) : (
            <div className="luxury-product-grid">
              {filteredProducts.map((p) => (
                <article className="product-card" key={p.id}>
                  <div className="card-media">
                    {p.tag && <span className="tag-pill">{p.tag}</span>}
                    <button className="quick-btn" onClick={() => setQuickViewProduct(p)}>Quick View +</button>
                    <a href={`/product/${p.id}`}>
                      <img src={p.image} alt={p.name} className="product-image" />
                    </a>
                  </div>

                  <div className="card-body">
                    <span className="brand-label">{p.brand}</span>
                    <a href={`/product/${p.id}`} className="title-link">
                      <h3>{p.name}</h3>
                    </a>

                    <div className="rating-row">
                      <span className="gold-stars">★★★★★</span>
                      <span className="rating-val">{p.rating}</span>
                      <span className="count">({p.reviewsCount})</span>
                    </div>

                    <div className="pricing">
                      <span className="price">{formatLKR(p.priceLKR)}</span>
                      {p.originalPriceLKR && <span className="original-price">{formatLKR(p.originalPriceLKR)}</span>}
                    </div>

                    <div className="bnpl-line">
                      <span>or <strong>{calculateInstallment(p.priceLKR, 3)}</strong>/mo with Koko & Mintpay</span>
                    </div>

                    <button className="add-bag-btn" onClick={() => addToCart(p)}>
                      Add to Bag
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 7. WhatsApp Advisory */}
      <section className="wa-banner">
        <div className="content-container wa-flex">
          <div className="wa-copy">
            <span className="sub-eyebrow light">PERSONALIZED CONSULTATION</span>
            <h2>Curate Your Custom <i>Routine.</i></h2>
            <p>Unsure which formulations fit your skin type? Connect directly with our Colombo skincare specialists on WhatsApp.</p>
            <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="wa-cta">
              Connect on WhatsApp →
            </a>
          </div>
        </div>
      </section>

      {/* 8. Footer */}
      <footer className="luxury-footer">
        <div className="content-container footer-grid">
          <div className="brand-col">
            <a className="brand-logo" href="/">
              <img src="/images/olivia-glow-logo.jpeg" alt="Olivia Glow Logo" className="logo-badge" />
              <span className="brand-name">OLIVIA <em>GLOW</em></span>
            </a>
            <p>Sri Lanka’s luxury beauty destination for clinical skincare and barrier repair rituals.</p>
          </div>

          <div className="links-col">
            <h4>Formulations</h4>
            <a href="#catalog" onClick={() => setSelectedCategory("SERUM")}>Serums & Oils</a>
            <a href="#catalog" onClick={() => setSelectedCategory("MOISTURIZERS")}>Moisturizers</a>
            <a href="#catalog" onClick={() => setSelectedCategory("SUN CREAM")}>Sun Care</a>
            <a href="#catalog" onClick={() => setSelectedCategory("DEVICE")}>Beauty Tech</a>
          </div>

          <div className="links-col">
            <h4>Connect</h4>
            <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer">WhatsApp Advisory</a>
            <a href="https://www.instagram.com/oliviaglow.lk?utm_source=qr" target="_blank" rel="noopener noreferrer">Instagram (@oliviaglow.lk)</a>
            <a href="https://www.tiktok.com/@oliviaglow41?_r=1&_t=ZS-98MOQHA4s9l" target="_blank" rel="noopener noreferrer">TikTok (@oliviaglow41)</a>
            <a href="https://www.facebook.com/share/1DB3Bx18WX/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook Community</a>
          </div>

          <div className="payments-col">
            <h4>Installments & Payment</h4>
            <p>Flexible checkout options:</p>
            <div className="p-badges">
              <span>Mintpay</span>
              <span>Koko</span>
              <span>Payzy</span>
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 Olivia Glow. All Rights Reserved.</p>
        </div>
      </footer>

      {/* 9. Mobile App Sticky Bottom Bar */}
      <div className="mobile-app-bottom-bar">
        <a href="/" className="mobile-bar-btn active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </a>
        <button className="mobile-bar-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          <span>Menu</span>
        </button>
        <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="mobile-bar-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>WhatsApp</span>
        </a>
        <button className="mobile-bar-btn" onClick={() => setIsDrawerOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>Bag ({cart.length})</span>
        </button>
      </div>

      {/* Bag Side Drawer */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <aside className="bag-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h3>YOUR SHOPPING BAG</h3>
              <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="drawer-empty">
                <p>Your bag is currently empty.</p>
                <button onClick={() => setIsDrawerOpen(false)}>Explore Catalog →</button>
              </div>
            ) : (
              <div className="drawer-body">
                <div className="cart-list">
                  {cart.map((item, idx) => (
                    <div className="cart-item" key={idx}>
                      <img src={item.image} alt={item.name} />
                      <div className="item-meta">
                        <strong>{item.name}</strong>
                        <p>{formatLKR(item.priceLKR)}</p>
                      </div>
                      <button className="remove-btn" onClick={() => removeFromCart(idx)}>✕</button>
                    </div>
                  ))}
                </div>

                <div className="drawer-foot">
                  <div className="total-row">
                    <span>Subtotal</span>
                    <strong>{formatLKR(cartTotal)}</strong>
                  </div>
                  <div className="installment-row">
                    <span>3 Monthly Installments</span>
                    <strong>{calculateInstallment(cartTotal, 3)}/mo</strong>
                  </div>
                  <button className="checkout-btn">
                    Proceed to Checkout ({formatLKR(cartTotal)}) →
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="modal-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setQuickViewProduct(null)}>✕</button>
            <div className="modal-grid">
              <img src={quickViewProduct.image} alt={quickViewProduct.name} />
              <div className="modal-info">
                <span className="brand-label">{quickViewProduct.brand}</span>
                <h2>{quickViewProduct.name}</h2>
                <p className="desc">{quickViewProduct.description}</p>
                <div className="benefits">
                  {quickViewProduct.benefits.map((b, i) => (
                    <span key={i} className="b-pill">✓ {b}</span>
                  ))}
                </div>
                <div className="price-box">
                  <strong>{formatLKR(quickViewProduct.priceLKR)}</strong>
                  <small>{calculateInstallment(quickViewProduct.priceLKR, 3)}/mo with Mintpay & Koko</small>
                </div>
                <button className="add-modal-btn" onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }}>
                  Add to Bag
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .luxury-storefront-root {
          min-height: 100vh;
          background: #fdfbf7;
          color: #191514;
          padding-bottom: 0;
        }

        .announcement-bar {
          background: #191514;
          color: #f7f2ec;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.08em;
          padding: 8px 16px;
          text-align: center;
        }

        .announcement-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .dot-sep {
          color: #c8a97e;
        }

        .glass-header {
          background: rgba(253, 251, 247, 0.95);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(25, 21, 20, 0.08);
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .header-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .mobile-menu-trigger {
          display: none;
          background: none;
          border: none;
          color: #191514;
          cursor: pointer;
          padding: 4px;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-badge {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 1px solid #c8a97e;
        }

        .brand-text {
          display: flex;
          flex-direction: column;
        }

        .brand-name {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #191514;
        }

        .brand-name em {
          color: #c8a97e;
          font-style: normal;
        }

        .brand-subtitle {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          color: #78716c;
          font-weight: 600;
        }

        .header-menu {
          display: flex;
          gap: 20px;
        }

        .menu-link {
          background: none;
          border: none;
          font-size: 0.82rem;
          font-weight: 500;
          color: #57534e;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .menu-link:hover,
        .menu-link.active {
          color: #191514;
          font-weight: 700;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          background: #f7f2ec;
          border: 1px solid rgba(25, 21, 20, 0.08);
          border-radius: 99px;
          padding: 6px 14px;
          gap: 8px;
        }

        .search-icon {
          color: #78716c;
        }

        .search-bar input {
          border: none;
          background: transparent;
          font-size: 0.8rem;
          outline: none;
          width: 130px;
        }

        .clear-search {
          background: none;
          border: none;
          color: #a8a29e;
          cursor: pointer;
        }

        .wa-consult-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #f7f2ec;
          border: 1px solid rgba(25, 21, 20, 0.1);
          color: #191514;
          padding: 7px 14px;
          border-radius: 99px;
          text-decoration: none;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .bag-button {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #191514;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 99px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .bag-badge {
          background: #c8a97e;
          color: #191514;
          font-size: 0.68rem;
          padding: 1px 6px;
          border-radius: 99px;
          font-weight: 700;
        }

        /* Mobile Off-Canvas Menu Drawer */
        .mobile-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 60;
          display: flex;
        }

        .mobile-drawer {
          width: 280px;
          background: #ffffff;
          height: 100%;
          display: flex;
          flex-direction: column;
          box-shadow: 4px 0 20px rgba(0, 0, 0, 0.1);
        }

        .mobile-drawer-head {
          padding: 16px 20px;
          border-bottom: 1px solid #f5f5f4;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .close-drawer {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .mobile-drawer-body {
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .mobile-search-box input {
          width: 100%;
          background: #f7f2ec;
          border: 1px solid rgba(25, 21, 20, 0.1);
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 0.82rem;
          outline: none;
        }

        .drawer-subhead {
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: #c8a97e;
          font-weight: 700;
          display: block;
          margin-bottom: 8px;
        }

        .mobile-nav-links {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .m-link {
          text-align: left;
          background: none;
          border: none;
          font-size: 0.9rem;
          color: #57534e;
          padding: 6px 0;
          cursor: pointer;
        }

        .m-link.active {
          color: #191514;
          font-weight: 700;
        }

        .mobile-drawer-footer {
          border-top: 1px solid #f5f5f4;
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .m-wa-btn {
          background: #191514;
          color: #ffffff;
          padding: 10px;
          border-radius: 8px;
          text-align: center;
          text-decoration: none;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .m-admin-link {
          color: #78716c;
          text-decoration: none;
          font-size: 0.8rem;
          text-align: center;
        }

        /* Hero Section */
        .hero-editorial {
          padding: 48px 24px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }

        .hero-eyebrow {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: #c8a97e;
          font-weight: 700;
          display: block;
          margin-bottom: 12px;
        }

        .hero-content h1 {
          font-family: var(--serif, 'Playfair Display', Georgia, serif);
          font-size: clamp(2.2rem, 5vw, 3.8rem);
          font-weight: 500;
          line-height: 1.1;
          margin-bottom: 16px;
        }

        .hero-content h1 i {
          font-style: italic;
          color: #c8a97e;
        }

        .hero-desc {
          font-size: 1rem;
          color: #57534e;
          line-height: 1.6;
          margin-bottom: 28px;
          max-width: 460px;
        }

        .hero-buttons {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-solid {
          background: #191514;
          color: #ffffff;
          padding: 14px 28px;
          border-radius: 99px;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .btn-text {
          color: #191514;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 600;
          border-bottom: 1px solid #191514;
          padding-bottom: 2px;
        }

        .image-frame {
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 16px 36px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(25, 21, 20, 0.08);
        }

        .image-frame img {
          width: 100%;
          height: 380px;
          object-fit: cover;
          display: block;
        }

        /* Brand Strip */
        .brand-strip {
          border-y: 1px solid rgba(25, 21, 20, 0.08);
          background: #f7f2ec;
          padding: 14px 0;
        }

        .content-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .strip-title {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          color: #78716c;
          font-weight: 700;
          margin-right: 14px;
        }

        .brand-pills {
          display: inline-flex;
          gap: 8px;
          overflow-x: auto;
        }

        .brand-btn {
          background: #ffffff;
          border: 1px solid rgba(25, 21, 20, 0.08);
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.78rem;
          color: #57534e;
          cursor: pointer;
        }

        .brand-btn.active,
        .brand-btn:hover {
          background: #191514;
          color: #ffffff;
        }

        /* Catalog Section */
        .catalog-section {
          padding: 60px 0;
        }

        .section-head {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 28px;
        }

        .sub-eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          color: #c8a97e;
          font-weight: 700;
        }

        .section-head h2 {
          font-family: var(--serif, 'Playfair Display', Georgia, serif);
          font-size: 2rem;
          font-weight: 500;
          margin-top: 4px;
        }

        .section-head h2 i {
          font-style: italic;
          color: #c8a97e;
        }

        .bnpl-note {
          background: #f7f2ec;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 0.78rem;
          color: #57534e;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          overflow-x: auto;
          padding-bottom: 4px;
        }

        .filter-tab {
          background: none;
          border: 1px solid rgba(25, 21, 20, 0.1);
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 500;
          color: #57534e;
          cursor: pointer;
          white-space: nowrap;
        }

        .filter-tab.active {
          background: #191514;
          color: #ffffff;
          border-color: #191514;
        }

        .luxury-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }

        .product-card {
          background: #ffffff;
          border: 1px solid rgba(25, 21, 20, 0.08);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 32px rgba(0, 0, 0, 0.05);
        }

        .card-media {
          position: relative;
          height: 240px;
          background: #fdfbf7;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
        }

        .product-image {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }

        .tag-pill {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #191514;
          color: #ffffff;
          font-size: 0.62rem;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .quick-btn {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(253, 251, 247, 0.9);
          border: 1px solid rgba(25, 21, 20, 0.1);
          padding: 6px 12px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
        }

        .card-body {
          padding: 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .brand-label {
          font-size: 0.68rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #78716c;
          text-transform: uppercase;
        }

        .title-link {
          text-decoration: none;
          color: inherit;
        }

        .card-body h3 {
          font-size: 0.92rem;
          font-weight: 600;
          margin: 4px 0 8px;
          line-height: 1.35;
        }

        .rating-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          margin-bottom: 12px;
        }

        .gold-stars { color: #c8a97e; }
        .rating-val { font-weight: 700; }
        .count { color: #78716c; }

        .pricing {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: auto;
        }

        .price {
          font-size: 1.05rem;
          font-weight: 700;
          color: #191514;
        }

        .original-price {
          font-size: 0.78rem;
          text-decoration: line-through;
          color: #a8a29e;
        }

        .bnpl-line {
          font-size: 0.72rem;
          color: #78716c;
          margin: 8px 0 14px;
        }

        .add-bag-btn {
          width: 100%;
          background: #191514;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
        }

        /* WhatsApp Section */
        .wa-banner {
          background: #191514;
          color: #ffffff;
          padding: 50px 0;
        }

        .wa-flex {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .wa-copy h2 {
          font-family: var(--serif, 'Playfair Display', Georgia, serif);
          font-size: 2rem;
          font-weight: 500;
          margin: 8px 0 12px;
        }

        .wa-copy h2 i {
          font-style: italic;
          color: #c8a97e;
        }

        .wa-copy p {
          font-size: 0.95rem;
          color: #a8a29e;
          max-width: 500px;
          margin-bottom: 20px;
        }

        .wa-cta {
          display: inline-block;
          background: #c8a97e;
          color: #191514;
          padding: 12px 24px;
          border-radius: 99px;
          text-decoration: none;
          font-weight: 700;
          font-size: 0.85rem;
        }

        /* Footer */
        .luxury-footer {
          background: #0f0d0c;
          color: #78716c;
          padding: 50px 0 80px;
        }

        .footer-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 32px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .brand-col p {
          font-size: 0.82rem;
          margin-top: 10px;
          line-height: 1.6;
        }

        .links-col {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .links-col h4,
        .payments-col h4 {
          color: #ffffff;
          font-size: 0.85rem;
          margin-bottom: 4px;
        }

        .links-col a {
          color: #a8a29e;
          text-decoration: none;
          font-size: 0.8rem;
        }

        .p-badges {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .p-badges span {
          background: #191514;
          color: #d6d3d1;
          font-size: 0.68rem;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .footer-bottom {
          text-align: center;
          padding-top: 20px;
          font-size: 0.72rem;
        }

        /* Mobile App Bottom Sticky Navigation Bar */
        .mobile-app-bottom-bar {
          display: none;
        }

        /* Drawer & Modal */
        .drawer-overlay,
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          justify-content: flex-end;
        }

        .modal-overlay {
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .bag-drawer {
          width: 100%;
          max-width: 380px;
          background: #ffffff;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .drawer-head {
          padding: 18px;
          border-bottom: 1px solid #f5f5f4;
          display: flex;
          justify-content: space-between;
        }

        .close-btn,
        .close-modal {
          background: none;
          border: none;
          font-size: 1.2rem;
          cursor: pointer;
        }

        .drawer-body {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .cart-list {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
        }

        .cart-item {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
        }

        .cart-item img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 6px;
        }

        .item-meta {
          flex: 1;
        }

        .item-meta strong {
          display: block;
          font-size: 0.82rem;
        }

        .remove-btn {
          background: none;
          border: none;
          color: #a8a29e;
          cursor: pointer;
        }

        .drawer-foot {
          padding: 18px;
          border-top: 1px solid #f5f5f4;
          background: #fdfbf7;
        }

        .total-row,
        .installment-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.85rem;
        }

        .checkout-btn {
          width: 100%;
          background: #191514;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          margin-top: 10px;
          cursor: pointer;
        }

        .modal-card {
          background: #ffffff;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          padding: 24px;
          position: relative;
        }

        .modal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .modal-grid img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          border-radius: 10px;
        }

        .benefits {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 10px 0;
        }

        .b-pill {
          background: #f7f2ec;
          font-size: 0.7rem;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .price-box {
          margin-bottom: 14px;
        }

        .price-box strong {
          font-size: 1.2rem;
          display: block;
        }

        .add-modal-btn {
          width: 100%;
          background: #191514;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        /* Responsive Breakpoints (<768px Mobile First) */
        @media (max-width: 768px) {
          .mobile-menu-trigger {
            display: block;
          }

          .header-menu {
            display: none;
          }

          .search-bar {
            display: none;
          }

          .hide-mobile {
            display: none;
          }

          .hero-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .image-frame img {
            height: 260px;
          }

          .bnpl-note {
            display: none;
          }

          .luxury-product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .card-media {
            height: 160px;
            padding: 10px;
          }

          .card-body {
            padding: 12px;
          }

          .card-body h3 {
            font-size: 0.8rem;
          }

          .price {
            font-size: 0.95rem;
          }

          .modal-grid {
            grid-template-columns: 1fr;
          }

          .mobile-app-bottom-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 56px;
            background: #ffffff;
            border-top: 1px solid rgba(25, 21, 20, 0.1);
            z-index: 45;
            justify-content: space-around;
            align-items: center;
          }

          .mobile-bar-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            color: #78716c;
            text-decoration: none;
            font-size: 0.65rem;
            font-weight: 600;
            flex: 1;
            height: 100%;
          }

          .mobile-bar-btn.active,
          .mobile-bar-btn:hover {
            color: #191514;
          }
        }
      `}</style>
    </main>
  );
}
