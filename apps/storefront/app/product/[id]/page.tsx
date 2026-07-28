"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PRODUCTS_CATALOG, BeautyProduct, formatLKR, calculateInstallment } from "../../data/products";

export default function ProductDetailPage() {
  const params = useParams();
  const productId = (params.id as string) || "prod-01";

  const product = PRODUCTS_CATALOG.find((p) => p.id === productId) || PRODUCTS_CATALOG[0];

  const [selectedImage, setSelectedImage] = useState(product.image);
  const [selectedSize, setSelectedSize] = useState("50ml Full Size");
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<BeautyProduct[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("desc");
  const [bundleAdded, setBundleAdded] = useState(false);

  const relatedProduct = PRODUCTS_CATALOG.find((p) => p.id !== product.id) || PRODUCTS_CATALOG[1];

  const addToBag = () => {
    for (let i = 0; i < quantity; i++) {
      setCart((prev) => [...prev, product]);
    }
    setIsDrawerOpen(true);
  };

  const addBundle = () => {
    setCart((prev) => [...prev, product, relatedProduct]);
    setBundleAdded(true);
    setIsDrawerOpen(true);
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.priceLKR, 0);

  return (
    <main className="luxury-product-root">
      {/* Top Announcement */}
      <div className="announcement-bar">
        <span>Complimentary Islandwide Shipping on Orders Over LKR 15,000 • 3-Month Installments with Koko & Mintpay</span>
      </div>

      {/* Header */}
      <header className="page-header">
        <div className="header-inner">
          <a className="brand-logo" href="/">
            <img src="/images/olivia-glow-logo.jpeg" alt="Olivia Glow Logo" className="logo-badge" />
            <div className="brand-text">
              <span className="brand-name">OLIVIA <em>GLOW</em></span>
            </div>
          </a>

          <div className="header-actions">
            <a href="/" className="back-link">← Return to Collection</a>
            <button className="bag-btn" onClick={() => setIsDrawerOpen(true)}>
              Bag ({cart.length})
            </button>
          </div>
        </div>
      </header>

      {/* Breadcrumb */}
      <div className="breadcrumb-bar">
        <div className="container">
          <a href="/">Home</a> / <a href="/#catalog">Catalog</a> / <span>{product.brand}</span> / <span className="active">{product.name}</span>
        </div>
      </div>

      {/* Main Grid */}
      <section className="product-section">
        <div className="container grid-two">
          {/* Gallery */}
          <div className="gallery-column">
            <div className="main-media">
              {product.tag && <span className="tag-pill">{product.tag}</span>}
              <img src={selectedImage || product.image} alt={product.name} />
            </div>

            <div className="thumb-row">
              <button className={`thumb ${selectedImage === product.image ? "active" : ""}`} onClick={() => setSelectedImage(product.image)}>
                <img src={product.image} alt="Thumb 1" />
              </button>
              <button className={`thumb ${selectedImage === product.secondaryImage ? "active" : ""}`} onClick={() => setSelectedImage(product.secondaryImage)}>
                <img src={product.secondaryImage} alt="Thumb 2" />
              </button>
            </div>
          </div>

          {/* Details */}
          <div className="info-column">
            <span className="brand-eyebrow">{product.brand}</span>
            <h1>{product.name}</h1>

            <div className="ratings-row">
              <span className="stars">★★★★★</span>
              <strong>{product.rating}</strong>
              <span className="rev-count">({product.reviewsCount} customer reviews)</span>
            </div>

            <div className="price-row">
              <span className="current-price">{formatLKR(product.priceLKR)}</span>
              {product.originalPriceLKR && <span className="strike-price">{formatLKR(product.originalPriceLKR)}</span>}
            </div>

            <div className="bnpl-pill-box">
              <span>💳 Pay in 3 monthly installments of <strong>{calculateInstallment(product.priceLKR, 3)}</strong> with</span>
              <div className="partners flex gap-2 mt-1">
                <span className="p-pill">Mintpay</span>
                <span className="p-pill">Koko</span>
                <span className="p-pill">Payzy</span>
              </div>
            </div>

            <p className="product-lead">{product.description}</p>

            {/* Size Selector */}
            <div className="option-section">
              <label>Formulation Size:</label>
              <div className="options-flex">
                {["50ml Full Size", "15ml Travel Size"].map((sz) => (
                  <button key={sz} className={`opt-btn ${selectedSize === sz ? "active" : ""}`} onClick={() => setSelectedSize(sz)}>
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="action-row">
              <div className="qty-picker">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)}>+</button>
              </div>

              <button className="add-bag-main" onClick={addToBag}>
                Add to Bag — {formatLKR(product.priceLKR * quantity)}
              </button>
            </div>

            {/* Guarantees */}
            <div className="guarantees-grid">
              <div className="g-item">
                <span>🚚 Islandwide Courier Delivery</span>
              </div>
              <div className="g-item">
                <span>🔒 100% Guaranteed Authentic</span>
              </div>
              <div className="g-item">
                <span>✨ Cash on Delivery Accepted</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="tabs-container">
              <div className="tab-headers">
                <button className={`tab-head ${activeTab === "desc" ? "active" : ""}`} onClick={() => setActiveTab("desc")}>Benefits</button>
                <button className={`tab-head ${activeTab === "usage" ? "active" : ""}`} onClick={() => setActiveTab("usage")}>How to Use</button>
                <button className={`tab-head ${activeTab === "shipping" ? "active" : ""}`} onClick={() => setActiveTab("shipping")}>Shipping</button>
              </div>

              <div className="tab-content">
                {activeTab === "desc" && (
                  <ul>
                    {product.benefits.map((b, i) => <li key={i}>✓ {b}</li>)}
                  </ul>
                )}
                {activeTab === "usage" && (
                  <p>Apply 2–3 drops morning and evening to cleansed skin. Gently massage face and neck until absorbed.</p>
                )}
                {activeTab === "shipping" && (
                  <p>Dispatched same-day from Colombo for orders placed before 2 PM. Cash on delivery supported nationwide.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bundle Upsell */}
      <section className="bundle-section">
        <div className="container">
          <div className="bundle-box">
            <span className="eyebrow">CURATED ROUTINE BUNDLE</span>
            <h2>Pair with {relatedProduct.name}</h2>
            <div className="bundle-flex">
              <div className="bundle-item">
                <img src={product.image} alt={product.name} />
                <div>
                  <strong>{product.name}</strong>
                  <p>{formatLKR(product.priceLKR)}</p>
                </div>
              </div>
              <span className="plus">+</span>
              <div className="bundle-item">
                <img src={relatedProduct.image} alt={relatedProduct.name} />
                <div>
                  <strong>{relatedProduct.name}</strong>
                  <p>{formatLKR(relatedProduct.priceLKR)}</p>
                </div>
              </div>

              <div className="bundle-cta">
                <div className="total">
                  <span>Bundle Price:</span>
                  <strong>{formatLKR(product.priceLKR + relatedProduct.priceLKR)}</strong>
                </div>
                <button className="btn-bundle" onClick={addBundle}>
                  {bundleAdded ? "Bundle Added ✓" : "Add Complete Routine to Bag (Save 15%)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drawer */}
      {isDrawerOpen && (
        <div className="drawer-overlay" onClick={() => setIsDrawerOpen(false)}>
          <aside className="bag-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head">
              <h3>YOUR SHOPPING BAG</h3>
              <button onClick={() => setIsDrawerOpen(false)}>✕</button>
            </div>
            <div className="drawer-body">
              <div className="items">
                {cart.map((item, idx) => (
                  <div key={idx} className="item">
                    <img src={item.image} alt={item.name} />
                    <div>
                      <strong>{item.name}</strong>
                      <p>{formatLKR(item.priceLKR)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="foot">
                <div className="sub">
                  <span>Subtotal</span>
                  <strong>{formatLKR(cartTotal)}</strong>
                </div>
                <button className="btn-checkout">Checkout ({formatLKR(cartTotal)}) →</button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .luxury-product-root {
          min-height: 100vh;
          background: #fdfbf7;
          color: #191514;
        }

        .announcement-bar {
          background: #191514;
          color: #f7f2ec;
          font-size: 0.72rem;
          padding: 8px 0;
          text-align: center;
          letter-spacing: 0.05em;
        }

        .page-header {
          background: #ffffff;
          border-bottom: 1px solid rgba(25, 21, 20, 0.08);
          padding: 14px 24px;
        }

        .header-inner {
          max-width: 1280px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          text-decoration: none;
        }

        .logo-badge {
          width: 32px;
          height: 32px;
          border-radius: 50%;
        }

        .brand-name {
          font-size: 1.1rem;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #191514;
        }

        .brand-name em {
          color: #c8a97e;
          font-style: normal;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .back-link {
          color: #78716c;
          text-decoration: none;
          font-size: 0.82rem;
        }

        .bag-btn {
          background: #191514;
          color: #ffffff;
          border: none;
          padding: 8px 18px;
          border-radius: 99px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 600;
        }

        .breadcrumb-bar {
          background: #ffffff;
          border-bottom: 1px solid rgba(25, 21, 20, 0.04);
          padding: 10px 0;
          font-size: 0.78rem;
          color: #78716c;
        }

        .breadcrumb-bar a {
          color: #191514;
          text-decoration: none;
        }

        .container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 24px;
        }

        .product-section {
          padding: 50px 0;
        }

        .grid-two {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 56px;
        }

        .main-media {
          position: relative;
          background: #ffffff;
          border: 1px solid rgba(25, 21, 20, 0.08);
          border-radius: 20px;
          padding: 24px;
          height: 460px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .main-media img {
          max-height: 100%;
          max-width: 100%;
          object-fit: cover;
          border-radius: 12px;
        }

        .tag-pill {
          position: absolute;
          top: 16px;
          left: 16px;
          background: #191514;
          color: #fff;
          font-size: 0.65rem;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .thumb-row {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }

        .thumb {
          width: 70px;
          height: 70px;
          border: 1px solid rgba(25, 21, 20, 0.1);
          border-radius: 10px;
          background: #fff;
          padding: 4px;
          cursor: pointer;
        }

        .thumb.active {
          border-color: #c8a97e;
        }

        .thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 6px;
        }

        .brand-eyebrow {
          font-size: 0.7rem;
          letter-spacing: 0.18em;
          color: #c8a97e;
          font-weight: 700;
        }

        .info-column h1 {
          font-family: var(--serif, 'Playfair Display', Georgia, serif);
          font-size: 2.2rem;
          font-weight: 500;
          margin: 6px 0 12px;
        }

        .ratings-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.85rem;
          margin-bottom: 20px;
        }

        .stars { color: #c8a97e; }
        .rev-count { color: #78716c; }

        .price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
          margin-bottom: 16px;
        }

        .current-price {
          font-size: 1.8rem;
          font-weight: 700;
        }

        .strike-price {
          font-size: 1.1rem;
          text-decoration: line-through;
          color: #a8a29e;
        }

        .bnpl-pill-box {
          background: #f7f2ec;
          border: 1px solid rgba(25, 21, 20, 0.08);
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.82rem;
          margin-bottom: 24px;
        }

        .p-pill {
          background: #191514;
          color: #fff;
          font-size: 0.65rem;
          padding: 2px 8px;
          border-radius: 4px;
        }

        .product-lead {
          font-size: 0.95rem;
          color: #57534e;
          line-height: 1.6;
          margin-bottom: 24px;
        }

        .option-section {
          margin-bottom: 24px;
        }

        .option-section label {
          display: block;
          font-size: 0.8rem;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .options-flex {
          display: flex;
          gap: 8px;
        }

        .opt-btn {
          background: #ffffff;
          border: 1px solid rgba(25, 21, 20, 0.1);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.82rem;
          cursor: pointer;
        }

        .opt-btn.active {
          background: #191514;
          color: #ffffff;
          border-color: #191514;
        }

        .action-row {
          display: flex;
          gap: 14px;
          margin-bottom: 32px;
        }

        .qty-picker {
          display: flex;
          align-items: center;
          border: 1px solid rgba(25, 21, 20, 0.15);
          border-radius: 8px;
          background: #fff;
        }

        .qty-picker button {
          border: none;
          background: none;
          padding: 12px 16px;
          font-weight: 700;
          cursor: pointer;
        }

        .qty-picker span {
          padding: 0 8px;
          font-weight: 700;
        }

        .add-bag-main {
          flex: 1;
          background: #191514;
          color: #ffffff;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
        }

        .guarantees-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          padding: 16px 0;
          border-y: 1px solid rgba(25, 21, 20, 0.08);
          margin-bottom: 28px;
          font-size: 0.78rem;
          color: #57534e;
        }

        .tabs-container {
          border: 1px solid rgba(25, 21, 20, 0.08);
          border-radius: 12px;
          background: #fff;
          overflow: hidden;
        }

        .tab-headers {
          display: flex;
          border-bottom: 1px solid rgba(25, 21, 20, 0.08);
        }

        .tab-head {
          flex: 1;
          background: none;
          border: none;
          padding: 14px;
          font-weight: 600;
          font-size: 0.85rem;
          color: #78716c;
          cursor: pointer;
        }

        .tab-head.active {
          color: #191514;
          border-bottom: 2px solid #191514;
        }

        .tab-content {
          padding: 20px;
          font-size: 0.85rem;
          color: #57534e;
          line-height: 1.6;
        }

        .bundle-section {
          padding: 50px 0 80px;
        }

        .bundle-box {
          background: #ffffff;
          border: 1px solid rgba(25, 21, 20, 0.08);
          border-radius: 20px;
          padding: 32px;
        }

        .eyebrow {
          font-size: 0.68rem;
          letter-spacing: 0.18em;
          color: #c8a97e;
          font-weight: 700;
        }

        .bundle-box h2 {
          font-family: var(--serif, 'Playfair Display', Georgia, serif);
          font-size: 1.6rem;
          margin: 4px 0 24px;
        }

        .bundle-flex {
          display: flex;
          align-items: center;
          gap: 24px;
          flex-wrap: wrap;
        }

        .bundle-item {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #fdfbf7;
          padding: 12px 16px;
          border-radius: 12px;
        }

        .bundle-item img {
          width: 50px;
          height: 50px;
          object-fit: cover;
          border-radius: 8px;
        }

        .plus {
          font-size: 1.2rem;
          color: #a8a29e;
        }

        .bundle-cta {
          margin-left: auto;
        }

        .btn-bundle {
          background: #191514;
          color: #fff;
          border: none;
          padding: 12px 24px;
          border-radius: 99px;
          font-weight: 600;
          cursor: pointer;
        }

        .drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 50;
          display: flex;
          justify-content: flex-end;
        }

        .bag-drawer {
          width: 100%;
          max-width: 400px;
          background: #fff;
          height: 100%;
          display: flex;
          flex-direction: column;
        }

        .drawer-head {
          padding: 20px;
          border-bottom: 1px solid #f5f5f4;
          display: flex;
          justify-content: space-between;
        }

        .drawer-body {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .items {
          flex: 1;
          overflow-y: auto;
          padding: 20px;
        }

        .item {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 12px;
        }

        .item img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 6px;
        }

        .foot {
          padding: 20px;
          border-top: 1px solid #f5f5f4;
          background: #fdfbf7;
        }

        .sub {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .btn-checkout {
          width: 100%;
          background: #191514;
          color: #fff;
          border: none;
          padding: 14px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .grid-two {
            grid-template-columns: 1fr;
          }

          .guarantees-grid {
            grid-template-columns: 1fr;
          }

          .bundle-cta {
            margin-left: 0;
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}
