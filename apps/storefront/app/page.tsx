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
    <main className="hibeauty-master-root">
      {/* 1. HiBeauty Announcement Marquee Bar */}
      <div className="hibeauty-marquee-strip">
        <div className="marquee-content">
          <span>GET 10% OFF ON YOUR FIRST ORDER WITH CODE: <strong>GLOW10</strong></span>
          <span className="marquee-sep">•</span>
          <span>ISLANDWIDE CASH ON DELIVERY AVAILABLE</span>
          <span className="marquee-sep">•</span>
          <span>100% AUTHENTIC K-BEAUTY & LUXURY SKINCARE</span>
          <span className="marquee-sep">•</span>
          <span>PAY IN 3 MONTHLY INSTALLMENTS WITH MINTPAY, KOKO & PAYZY</span>
          <span className="marquee-sep">•</span>
        </div>
      </div>

      {/* 2. HiBeauty Clean Header */}
      <header className="hibeauty-header">
        <div className="header-inner-wrap">
          {/* Mobile Menu Trigger */}
          <button className="mobile-toggle-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="Menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>

          {/* Logo */}
          <a href="/" className="brand-logo">
            <img src="/images/olivia-glow-logo.jpeg" alt="Olivia Glow Logo" className="logo-badge" />
            <div className="brand-title">
              <span className="name">OLIVIA <em>GLOW</em></span>
              <span className="sub">K-BEAUTY & LUXURY CARE</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav">
            <button className={`nav-link ${selectedCategory === "ALL" ? "active" : ""}`} onClick={() => setSelectedCategory("ALL")}>NEW ARRIVALS</button>
            <button className={`nav-link ${selectedCategory === "SERUM" ? "active" : ""}`} onClick={() => setSelectedCategory("SERUM")}>SERUMS & ESSENCES</button>
            <button className={`nav-link ${selectedCategory === "MOISTURIZERS" ? "active" : ""}`} onClick={() => setSelectedCategory("MOISTURIZERS")}>CREAMS</button>
            <button className={`nav-link ${selectedCategory === "DEVICE" ? "active" : ""}`} onClick={() => setSelectedCategory("DEVICE")}>BEAUTY TECH</button>
            <button className={`nav-link ${selectedCategory === "SUN CREAM" ? "active" : ""}`} onClick={() => setSelectedCategory("SUN CREAM")}>SUN CARE</button>
            <button className={`nav-link ${selectedCategory === "TONER" ? "active" : ""}`} onClick={() => setSelectedCategory("TONER")}>TONERS</button>
          </nav>

          {/* Action Bar */}
          <div className="header-actions">
            <div className="search-input-box">
              <svg className="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              {searchQuery && <button className="clear-btn" onClick={() => setSearchQuery("")}>✕</button>}
            </div>

            <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="wa-consult-btn" title="WhatsApp Advice">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <span className="hide-mobile">Consult</span>
            </a>

            <button className="bag-trigger-btn" onClick={() => setIsDrawerOpen(true)} aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              {cart.length > 0 && <span className="bag-badge">{cart.length}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* 3. Mobile Navigation Drawer */}
      {isMobileMenuOpen && (
        <div className="mobile-drawer-backdrop" onClick={() => setIsMobileMenuOpen(false)}>
          <aside className="mobile-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-drawer-header">
              <a href="/" className="brand-logo">
                <img src="/images/olivia-glow-logo.jpeg" alt="Logo" className="logo-badge" />
                <span className="name">OLIVIA <em>GLOW</em></span>
              </a>
              <button className="close-btn" onClick={() => setIsMobileMenuOpen(false)}>✕</button>
            </div>

            <div className="mobile-drawer-body">
              <div className="m-search">
                <input type="text" placeholder="Search skincare..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              <div className="m-section">
                <span className="m-subhead">CATEGORIES</span>
                <button className={`m-item ${selectedCategory === "ALL" ? "active" : ""}`} onClick={() => { setSelectedCategory("ALL"); setIsMobileMenuOpen(false); }}>All Products</button>
                <button className={`m-item ${selectedCategory === "SERUM" ? "active" : ""}`} onClick={() => { setSelectedCategory("SERUM"); setIsMobileMenuOpen(false); }}>Serums & Essences</button>
                <button className={`m-item ${selectedCategory === "MOISTURIZERS" ? "active" : ""}`} onClick={() => { setSelectedCategory("MOISTURIZERS"); setIsMobileMenuOpen(false); }}>Moisturizers & Creams</button>
                <button className={`m-item ${selectedCategory === "DEVICE" ? "active" : ""}`} onClick={() => { setSelectedCategory("DEVICE"); setIsMobileMenuOpen(false); }}>Beauty Tech Devices</button>
                <button className={`m-item ${selectedCategory === "SUN CREAM" ? "active" : ""}`} onClick={() => { setSelectedCategory("SUN CREAM"); setIsMobileMenuOpen(false); }}>Sun Care & Sunscreens</button>
                <button className={`m-item ${selectedCategory === "TONER" ? "active" : ""}`} onClick={() => { setSelectedCategory("TONER"); setIsMobileMenuOpen(false); }}>Toner Pads</button>
              </div>

              <div className="m-section">
                <span className="m-subhead">SOCIAL CHANNELS</span>
                <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="m-item">WhatsApp Advisory</a>
                <a href="https://www.instagram.com/oliviaglow.lk?utm_source=qr" target="_blank" rel="noopener noreferrer" className="m-item">Instagram (@oliviaglow.lk)</a>
                <a href="https://www.tiktok.com/@oliviaglow41?_r=1&_t=ZS-98MOQHA4s9l" target="_blank" rel="noopener noreferrer" className="m-item">TikTok (@oliviaglow41)</a>
                <a href="https://www.facebook.com/share/1DB3Bx18WX/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer" className="m-item">Facebook Community</a>
              </div>

              <div className="m-footer">
                <a href="/admin" className="admin-btn">Admin Portal Login</a>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 4. HiBeauty Hero Slider Banner */}
      <section className="hibeauty-hero-section">
        <div className="hero-banner-container">
          <div className="hero-copy-box">
            <span className="hero-tag-pill">SRI LANKA'S PREMIER K-BEAUTY HOUSE</span>
            <h1>Authentic Korean Skincare & <i>Beauty Tech.</i></h1>
            <p>Elevate your skin barrier with clinical Medicube tech, Beauty of Joseon sunscreens, and Olivia Glow radiance formulas.</p>

            <div className="hero-actions">
              <a href="#catalog" className="btn-shop-now">SHOP CATALOG NOW</a>
              <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="btn-wa">
                FREE SKIN CONSULTATION →
              </a>
            </div>
          </div>

          <div className="hero-image-box">
            <img src="/images/hero_cover.png" alt="HiBeauty K-Beauty Hero" />
          </div>
        </div>
      </section>

      {/* 5. "Shop by Skin Goal" Concern Cards */}
      <section className="skin-goals-section">
        <div className="main-container">
          <div className="section-title-wrap">
            <span className="eyebrow-text">TARGETED RESULTS</span>
            <h2>Shop by <i>Skin Goal</i></h2>
          </div>

          <div className="goals-grid">
            <button className="goal-card" onClick={() => setSelectedCategory("SERUM")}>
              <span className="goal-icon">🌟</span>
              <h3>Glass Skin Radiance</h3>
              <p>Hyaluronic & Niacinamide dewy serums</p>
            </button>

            <button className="goal-card" onClick={() => setSelectedCategory("MOISTURIZERS")}>
              <span className="goal-icon">🛡️</span>
              <h3>Barrier Repair</h3>
              <p>Ceramide & Snail Mucin skin recovery</p>
            </button>

            <button className="goal-card" onClick={() => setSelectedCategory("TONER")}>
              <span className="goal-icon">🧼</span>
              <h3>Pore & Acne Care</h3>
              <p>Heartleaf & Azelaic calming toner pads</p>
            </button>

            <button className="goal-card" onClick={() => setSelectedCategory("SUN CREAM")}>
              <span className="goal-icon">☀️</span>
              <h3>Sun Protection</h3>
              <p>Organic SPF50+ zero white cast sunscreens</p>
            </button>

            <button className="goal-card" onClick={() => setSelectedCategory("DEVICE")}>
              <span className="goal-icon">⚡</span>
              <h3>Beauty Tech Devices</h3>
              <p>Medicube AGE-R Electroporation devices</p>
            </button>
          </div>
        </div>
      </section>

      {/* 6. HiBeauty Brands Showcase */}
      <section className="brands-strip-section">
        <div className="main-container flex-brands">
          <span className="strip-label">FEATURED BRANDS:</span>
          <div className="brand-buttons-row">
            <button className={`brand-pill ${selectedBrand === "ALL" ? "active" : ""}`} onClick={() => setSelectedBrand("ALL")}>All Brands</button>
            {FEATURED_BRANDS.map((b) => (
              <button key={b.name} className={`brand-pill ${selectedBrand === b.name ? "active" : ""}`} onClick={() => setSelectedBrand(b.name)}>
                {b.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 7. HiBeauty Product Grid */}
      <section className="products-catalog-section" id="catalog">
        <div className="main-container">
          <div className="catalog-header-row">
            <div>
              <span className="eyebrow-text">CURATED FORMULATIONS</span>
              <h2>Curated <i>Products</i></h2>
            </div>

            <div className="bnpl-header-pill">
              💳 Pay in 3 monthly installments with <strong>Mintpay, Koko & Payzy</strong>
            </div>
          </div>

          {/* Category Filters */}
          <div className="category-filter-bar">
            <button className={`cat-btn ${selectedCategory === "ALL" ? "active" : ""}`} onClick={() => setSelectedCategory("ALL")}>All Products</button>
            {CATEGORIES.map((cat) => (
              <button key={cat} className={`cat-btn ${selectedCategory === cat ? "active" : ""}`} onClick={() => setSelectedCategory(cat)}>
                {cat}
              </button>
            ))}
          </div>

          {filteredProducts.length === 0 ? (
            <div className="empty-catalog">
              <p>No products found for this filter selection.</p>
              <button onClick={() => { setSelectedCategory("ALL"); setSelectedBrand("ALL"); setSearchQuery(""); }}>Reset Catalog</button>
            </div>
          ) : (
            <div className="hibeauty-product-grid">
              {filteredProducts.map((product) => (
                <article className="hibeauty-card" key={product.id}>
                  {/* Top Image Box */}
                  <div className="card-image-box">
                    {product.tag && <span className="card-badge">{product.tag}</span>}
                    <button className="quick-view-overlay-btn" onClick={() => setQuickViewProduct(product)}>Quick View +</button>
                    <a href={`/product/${product.id}`}>
                      <img src={product.image} alt={product.name} className="product-thumb" />
                    </a>
                  </div>

                  {/* Card Content Details */}
                  <div className="card-content-box">
                    <span className="card-brand-name">{product.brand}</span>
                    <a href={`/product/${product.id}`} className="card-title-link">
                      <h3 className="card-product-title">{product.name}</h3>
                    </a>

                    <div className="card-rating-line">
                      <span className="stars-fill">★★★★★</span>
                      <span className="rating-num">{product.rating}</span>
                      <span className="rev-num">({product.reviewsCount})</span>
                    </div>

                    <div className="card-price-line">
                      <span className="main-lkr">{formatLKR(product.priceLKR)}</span>
                      {product.originalPriceLKR && <span className="strike-lkr">{formatLKR(product.originalPriceLKR)}</span>}
                    </div>

                    {/* HiBeauty Signature BNPL Pill Box */}
                    <div className="bnpl-installment-box">
                      <span className="bnpl-text">or <strong>{calculateInstallment(product.priceLKR, 3)}</strong> x 3 with</span>
                      <div className="bnpl-badges-flex">
                        <span className="bnpl-chip mintpay">Mintpay</span>
                        <span className="bnpl-chip koko">Koko</span>
                        <span className="bnpl-chip payzy">Payzy</span>
                      </div>
                    </div>

                    <button className="btn-add-to-bag" onClick={() => addToCart(product)}>
                      ADD TO BAG
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 8. HiBeauty WhatsApp Consultation Banner */}
      <section className="hibeauty-wa-banner">
        <div className="main-container flex-wa-wrap">
          <div className="wa-info">
            <span className="eyebrow-text gold">FREE SKINCARE ADVISORY</span>
            <h2>Need Help Choosing Your <i>Routine?</i></h2>
            <p>Chat directly with our Colombo skincare specialists on WhatsApp for personalized product recommendations tailored to your skin type.</p>
            <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="btn-connect-wa">
              CONNECT ON WHATSAPP →
            </a>
          </div>
        </div>
      </section>

      {/* 9. HiBeauty Footer */}
      <footer className="hibeauty-footer">
        <div className="main-container footer-cols-grid">
          <div className="f-col brand-info">
            <a href="/" className="brand-logo">
              <img src="/images/olivia-glow-logo.jpeg" alt="Logo" className="logo-badge" />
              <span className="name">OLIVIA <em>GLOW</em></span>
            </a>
            <p>Sri Lanka’s premier destination for authentic K-Beauty, clinical beauty tech devices, and barrier repair skincare.</p>
          </div>

          <div className="f-col">
            <h4>Quick Links</h4>
            <a href="#catalog" onClick={() => setSelectedCategory("SERUM")}>Serums & Essences</a>
            <a href="#catalog" onClick={() => setSelectedCategory("MOISTURIZERS")}>Moisturizers</a>
            <a href="#catalog" onClick={() => setSelectedCategory("DEVICE")}>Beauty Tech</a>
            <a href="#catalog" onClick={() => setSelectedCategory("SUN CREAM")}>Sun Care</a>
          </div>

          <div className="f-col">
            <h4>Social Channels</h4>
            <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer">WhatsApp Advisory</a>
            <a href="https://www.instagram.com/oliviaglow.lk?utm_source=qr" target="_blank" rel="noopener noreferrer">Instagram (@oliviaglow.lk)</a>
            <a href="https://www.tiktok.com/@oliviaglow41?_r=1&_t=ZS-98MOQHA4s9l" target="_blank" rel="noopener noreferrer">TikTok (@oliviaglow41)</a>
            <a href="https://www.facebook.com/share/1DB3Bx18WX/?mibextid=wwXIfr" target="_blank" rel="noopener noreferrer">Facebook Page</a>
          </div>

          <div className="f-col">
            <h4>Installments Accepted</h4>
            <p>Checkout flexibly in 3 interest-free installments:</p>
            <div className="payment-chips">
              <span>Mintpay</span>
              <span>Koko</span>
              <span>Payzy</span>
              <span>Cash on Delivery</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom-copyright">
          <p>© 2026 Olivia Glow. All Rights Reserved. Inspired by HiBeauty.lk</p>
        </div>
      </footer>

      {/* 10. Sticky Mobile App Bottom Bar */}
      <div className="sticky-mobile-app-bar">
        <a href="/" className="m-bar-btn active">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          <span>Home</span>
        </a>
        <button className="m-bar-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
          <span>Categories</span>
        </button>
        <a href="https://wa.me/message/RXH3PJIFMXAEP1" target="_blank" rel="noopener noreferrer" className="m-bar-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span>WhatsApp</span>
        </a>
        <button className="m-bar-btn" onClick={() => setIsDrawerOpen(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>Bag ({cart.length})</span>
        </button>
      </div>

      {/* Slide-Out Cart Drawer */}
      {isDrawerOpen && (
        <div className="drawer-backdrop-overlay" onClick={() => setIsDrawerOpen(false)}>
          <aside className="bag-slide-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h3>YOUR SHOPPING BAG</h3>
              <button className="close-btn" onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>

            {cart.length === 0 ? (
              <div className="drawer-empty-body">
                <p>Your bag is currently empty.</p>
                <button onClick={() => setIsDrawerOpen(false)}>SHOP CATALOG NOW →</button>
              </div>
            ) : (
              <div className="drawer-active-body">
                <div className="cart-items-scroll">
                  {cart.map((item, idx) => (
                    <div className="cart-item-row" key={idx}>
                      <img src={item.image} alt={item.name} />
                      <div className="item-details">
                        <strong>{item.name}</strong>
                        <p>{formatLKR(item.priceLKR)}</p>
                      </div>
                      <button className="btn-remove" onClick={() => removeFromCart(idx)}>✕</button>
                    </div>
                  ))}
                </div>

                <div className="drawer-footer-summary">
                  <div className="summary-row">
                    <span>Subtotal</span>
                    <strong>{formatLKR(cartTotal)}</strong>
                  </div>
                  <div className="summary-row installment">
                    <span>3 Monthly Installments</span>
                    <strong>{calculateInstallment(cartTotal, 3)}/mo</strong>
                  </div>
                  <button className="btn-checkout-now">
                    PROCEED TO CHECKOUT ({formatLKR(cartTotal)}) →
                  </button>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <div className="modal-backdrop-overlay" onClick={() => setQuickViewProduct(null)}>
          <div className="quick-view-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setQuickViewProduct(null)}>✕</button>
            <div className="modal-grid-layout">
              <img src={quickViewProduct.image} alt={quickViewProduct.name} />
              <div className="modal-info-col">
                <span className="brand-eyebrow">{quickViewProduct.brand}</span>
                <h2>{quickViewProduct.name}</h2>
                <p className="description">{quickViewProduct.description}</p>
                
                <div className="benefits-list">
                  {quickViewProduct.benefits.map((b, i) => (
                    <span key={i} className="b-chip">✓ {b}</span>
                  ))}
                </div>

                <div className="price-installment-box">
                  <strong>{formatLKR(quickViewProduct.priceLKR)}</strong>
                  <small>{calculateInstallment(quickViewProduct.priceLKR, 3)}/mo with Mintpay, Koko & Payzy</small>
                </div>

                <button className="btn-modal-add-bag" onClick={() => { addToCart(quickViewProduct); setQuickViewProduct(null); }}>
                  ADD TO BAG
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS Styles */}
      <style jsx>{`
        .hibeauty-master-root {
          min-height: 100vh;
          background: #faf8f5;
          color: #1c1917;
          font-family: inherit;
        }

        .hibeauty-marquee-strip {
          background: #1c1917;
          color: #ffffff;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.06em;
          padding: 8px 16px;
          text-align: center;
        }

        .marquee-content {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .marquee-sep {
          color: #d4af37;
        }

        .hibeauty-header {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e7e5e4;
          position: sticky;
          top: 0;
          z-index: 40;
        }

        .header-inner-wrap {
          max-width: 1280px;
          margin: 0 auto;
          padding: 12px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .mobile-toggle-btn {
          display: none;
          background: none;
          border: none;
          color: #1c1917;
          cursor: pointer;
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
          border: 1px solid #d4af37;
        }

        .brand-title {
          display: flex;
          flex-direction: column;
        }

        .brand-title .name {
          font-size: 1.15rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #1c1917;
        }

        .brand-title .name em {
          color: #b91c1c;
          font-style: normal;
        }

        .brand-title .sub {
          font-size: 0.58rem;
          letter-spacing: 0.18em;
          color: #78716c;
          font-weight: 600;
        }

        .desktop-nav {
          display: flex;
          gap: 16px;
        }

        .nav-link {
          background: none;
          border: none;
          font-size: 0.78rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #57534e;
          cursor: pointer;
          transition: color 0.15s ease;
        }

        .nav-link:hover,
        .nav-link.active {
          color: #b91c1c;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .search-input-box {
          display: flex;
          align-items: center;
          background: #f5f5f4;
          border: 1px solid #e7e5e4;
          border-radius: 99px;
          padding: 6px 14px;
          gap: 8px;
        }

        .search-icon {
          color: #78716c;
        }

        .search-input-box input {
          border: none;
          background: transparent;
          font-size: 0.8rem;
          outline: none;
          width: 130px;
        }

        .clear-btn {
          background: none;
          border: none;
          color: #a8a29e;
          cursor: pointer;
        }

        .wa-consult-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #059669;
          color: #ffffff;
          padding: 7px 14px;
          border-radius: 99px;
          text-decoration: none;
          font-size: 0.78rem;
          font-weight: 600;
        }

        .bag-trigger-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #1c1917;
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 99px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          position: relative;
        }

        .bag-badge {
          background: #b91c1c;
          color: #ffffff;
          font-size: 0.65rem;
          padding: 2px 6px;
          border-radius: 99px;
          font-weight: 800;
        }

        /* Mobile Drawer */
        .mobile-drawer-backdrop {
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
        }

        .mobile-drawer-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f5f5f4;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .mobile-drawer-body {
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .m-search input {
          width: 100%;
          background: #f5f5f4;
          border: 1px solid #e7e5e4;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.82rem;
        }

        .m-subhead {
          font-size: 0.65rem;
          letter-spacing: 0.15em;
          color: #b91c1c;
          font-weight: 800;
          display: block;
          margin-bottom: 8px;
        }

        .m-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .m-item {
          text-align: left;
          background: none;
          border: none;
          font-size: 0.88rem;
          color: #57534e;
          padding: 6px 0;
          cursor: pointer;
          text-decoration: none;
        }

        .m-item.active {
          color: #b91c1c;
          font-weight: 700;
        }

        .m-footer {
          border-top: 1px solid #f5f5f4;
          padding-top: 16px;
        }

        .admin-btn {
          color: #78716c;
          text-decoration: none;
          font-size: 0.8rem;
        }

        /* Hero Banner */
        .hibeauty-hero-section {
          padding: 40px 24px;
          max-width: 1280px;
          margin: 0 auto;
        }

        .hero-banner-container {
          background: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 24px;
          padding: 40px;
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 40px;
          align-items: center;
        }

        .hero-tag-pill {
          background: #fef2f2;
          color: #b91c1c;
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          padding: 4px 10px;
          border-radius: 4px;
          display: inline-block;
          margin-bottom: 12px;
        }

        .hero-copy-box h1 {
          font-size: 2.6rem;
          font-weight: 800;
          line-height: 1.15;
          margin-bottom: 14px;
        }

        .hero-copy-box h1 i {
          font-style: normal;
          color: #b91c1c;
        }

        .hero-copy-box p {
          font-size: 1rem;
          color: #57534e;
          line-height: 1.6;
          margin-bottom: 28px;
        }

        .hero-actions {
          display: flex;
          gap: 14px;
          align-items: center;
        }

        .btn-shop-now {
          background: #1c1917;
          color: #ffffff;
          padding: 14px 28px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          text-decoration: none;
        }

        .btn-wa {
          color: #059669;
          text-decoration: none;
          font-size: 0.85rem;
          font-weight: 700;
        }

        .hero-image-box img {
          width: 100%;
          height: 340px;
          object-fit: cover;
          border-radius: 16px;
        }

        /* Skin Goals Section */
        .skin-goals-section {
          padding: 40px 0;
        }

        .main-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .section-title-wrap {
          margin-bottom: 24px;
        }

        .eyebrow-text {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #b91c1c;
        }

        .eyebrow-text.gold {
          color: #d4af37;
        }

        .section-title-wrap h2 {
          font-size: 2rem;
          font-weight: 800;
          margin-top: 4px;
        }

        .section-title-wrap h2 i {
          font-style: normal;
          color: #b91c1c;
        }

        .goals-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .goal-card {
          background: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          padding: 20px;
          text-align: left;
          cursor: pointer;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .goal-card:hover {
          transform: translateY(-4px);
          border-color: #b91c1c;
        }

        .goal-icon {
          font-size: 1.8rem;
          display: block;
          margin-bottom: 10px;
        }

        .goal-card h3 {
          font-size: 0.95rem;
          font-weight: 700;
          margin-bottom: 4px;
        }

        .goal-card p {
          font-size: 0.78rem;
          color: #78716c;
          line-height: 1.4;
        }

        /* Brands Strip */
        .brands-strip-section {
          background: #ffffff;
          border-y: 1px solid #e7e5e4;
          padding: 16px 0;
        }

        .flex-brands {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .strip-label {
          font-size: 0.7rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #78716c;
        }

        .brand-buttons-row {
          display: flex;
          gap: 8px;
          overflow-x: auto;
        }

        .brand-pill {
          background: #f5f5f4;
          border: 1px solid #e7e5e4;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #57534e;
          cursor: pointer;
        }

        .brand-pill.active {
          background: #1c1917;
          color: #ffffff;
        }

        /* Products Catalog Grid */
        .products-catalog-section {
          padding: 60px 0;
        }

        .catalog-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 24px;
        }

        .catalog-header-row h2 {
          font-size: 2rem;
          font-weight: 800;
        }

        .catalog-header-row h2 i {
          font-style: normal;
          color: #b91c1c;
        }

        .bnpl-header-pill {
          background: #ffffff;
          border: 1px solid #e7e5e4;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 0.78rem;
          color: #57534e;
        }

        .category-filter-bar {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
          overflow-x: auto;
        }

        .cat-btn {
          background: #ffffff;
          border: 1px solid #e7e5e4;
          padding: 8px 18px;
          border-radius: 99px;
          font-size: 0.78rem;
          font-weight: 700;
          color: #57534e;
          cursor: pointer;
          white-space: nowrap;
        }

        .cat-btn.active {
          background: #b91c1c;
          color: #ffffff;
          border-color: #b91c1c;
        }

        .hibeauty-product-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 24px;
        }

        .hibeauty-card {
          background: #ffffff;
          border: 1px solid #e7e5e4;
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .hibeauty-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.06);
        }

        .card-image-box {
          position: relative;
          height: 240px;
          background: #faf8f5;
          padding: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .product-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 12px;
        }

        .card-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          background: #b91c1c;
          color: #ffffff;
          font-size: 0.62rem;
          font-weight: 800;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .quick-view-overlay-btn {
          position: absolute;
          bottom: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid #e7e5e4;
          padding: 6px 12px;
          border-radius: 99px;
          font-size: 0.72rem;
          font-weight: 700;
          cursor: pointer;
        }

        .card-content-box {
          padding: 18px;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-brand-name {
          font-size: 0.68rem;
          font-weight: 800;
          letter-spacing: 0.12em;
          color: #78716c;
          text-transform: uppercase;
        }

        .card-title-link {
          text-decoration: none;
          color: inherit;
        }

        .card-product-title {
          font-size: 0.92rem;
          font-weight: 700;
          margin: 4px 0 8px;
          line-height: 1.35;
        }

        .card-rating-line {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.78rem;
          margin-bottom: 10px;
        }

        .stars-fill { color: #d4af37; }
        .rating-num { font-weight: 700; }
        .rev-num { color: #78716c; }

        .card-price-line {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-top: auto;
        }

        .main-lkr {
          font-size: 1.1rem;
          font-weight: 800;
          color: #1c1917;
        }

        .strike-lkr {
          font-size: 0.8rem;
          text-decoration: line-through;
          color: #a8a29e;
        }

        .bnpl-installment-box {
          background: #faf8f5;
          border: 1px solid #e7e5e4;
          padding: 8px 10px;
          border-radius: 8px;
          margin: 10px 0 14px;
          font-size: 0.7rem;
        }

        .bnpl-text {
          color: #57534e;
        }

        .bnpl-badges-flex {
          display: flex;
          gap: 4px;
          margin-top: 4px;
        }

        .bnpl-chip {
          font-size: 0.6rem;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          color: #ffffff;
        }

        .bnpl-chip.mintpay { background: #1c1917; }
        .bnpl-chip.koko { background: #b91c1c; }
        .bnpl-chip.payzy { background: #0284c7; }

        .btn-add-to-bag {
          width: 100%;
          background: #1c1917;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.82rem;
          font-weight: 800;
          cursor: pointer;
        }

        .btn-add-to-bag:hover {
          background: #b91c1c;
        }

        /* WhatsApp Advisory Banner */
        .hibeauty-wa-banner {
          background: #1c1917;
          color: #ffffff;
          padding: 50px 0;
        }

        .wa-info h2 {
          font-size: 2.2rem;
          font-weight: 800;
          margin: 8px 0 12px;
        }

        .wa-info h2 i {
          font-style: normal;
          color: #d4af37;
        }

        .wa-info p {
          font-size: 0.95rem;
          color: #a8a29e;
          max-width: 520px;
          margin-bottom: 24px;
        }

        .btn-connect-wa {
          background: #059669;
          color: #ffffff;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 800;
          font-size: 0.85rem;
          text-decoration: none;
          display: inline-block;
        }

        /* Footer */
        .hibeauty-footer {
          background: #0f0d0c;
          color: #78716c;
          padding: 50px 0 80px;
        }

        .footer-cols-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 32px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .f-col h4 {
          color: #ffffff;
          font-size: 0.85rem;
          margin-bottom: 12px;
        }

        .f-col a {
          color: #a8a29e;
          text-decoration: none;
          font-size: 0.8rem;
          display: block;
          margin-bottom: 6px;
        }

        .payment-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 10px;
        }

        .payment-chips span {
          background: #1c1917;
          color: #d6d3d1;
          font-size: 0.68rem;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .footer-bottom-copyright {
          text-align: center;
          padding-top: 20px;
          font-size: 0.72rem;
        }

        /* Sticky Mobile App Bar */
        .sticky-mobile-app-bar {
          display: none;
        }

        /* Cart Drawer & Modals */
        .drawer-backdrop-overlay,
        .modal-backdrop-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          justify-content: flex-end;
        }

        .modal-backdrop-overlay {
          justify-content: center;
          align-items: center;
          padding: 20px;
        }

        .bag-slide-drawer {
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

        .drawer-active-body {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .cart-items-scroll {
          flex: 1;
          overflow-y: auto;
          padding: 18px;
        }

        .cart-item-row {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 14px;
        }

        .cart-item-row img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 6px;
        }

        .item-details {
          flex: 1;
        }

        .item-details strong {
          display: block;
          font-size: 0.82rem;
        }

        .btn-remove {
          background: none;
          border: none;
          color: #a8a29e;
          cursor: pointer;
        }

        .drawer-footer-summary {
          padding: 18px;
          border-top: 1px solid #f5f5f4;
          background: #faf8f5;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 0.85rem;
        }

        .btn-checkout-now {
          width: 100%;
          background: #b91c1c;
          color: #ffffff;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-weight: 800;
          margin-top: 10px;
          cursor: pointer;
        }

        .quick-view-card {
          background: #ffffff;
          border-radius: 16px;
          max-width: 600px;
          width: 100%;
          padding: 24px;
          position: relative;
        }

        .modal-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .modal-grid-layout img {
          width: 100%;
          height: 220px;
          object-fit: cover;
          border-radius: 10px;
        }

        .benefits-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin: 10px 0;
        }

        .b-chip {
          background: #fef2f2;
          color: #b91c1c;
          font-size: 0.7rem;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .price-installment-box {
          margin-bottom: 14px;
        }

        .price-installment-box strong {
          font-size: 1.2rem;
          display: block;
        }

        .btn-modal-add-bag {
          width: 100%;
          background: #1c1917;
          color: #ffffff;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .mobile-toggle-btn {
            display: block;
          }

          .desktop-nav,
          .search-input-box,
          .hide-mobile,
          .bnpl-header-pill {
            display: none;
          }

          .hero-banner-container {
            grid-template-columns: 1fr;
            padding: 24px;
          }

          .hero-image-box img {
            height: 240px;
          }

          .hibeauty-product-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }

          .card-image-box {
            height: 160px;
            padding: 10px;
          }

          .card-content-box {
            padding: 12px;
          }

          .modal-grid-layout {
            grid-template-columns: 1fr;
          }

          .sticky-mobile-app-bar {
            display: flex;
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 56px;
            background: #ffffff;
            border-top: 1px solid #e7e5e4;
            z-index: 45;
            justify-content: space-around;
            align-items: center;
          }

          .m-bar-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: none;
            border: none;
            color: #78716c;
            font-size: 0.65rem;
            font-weight: 600;
            flex: 1;
            height: 100%;
            text-decoration: none;
          }

          .m-bar-btn.active,
          .m-bar-btn:hover {
            color: #b91c1c;
          }
        }
      `}</style>
    </main>
  );
}
