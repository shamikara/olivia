"use client";

export function MarqueeBar() {
  const items = [
    "🚚 Islandwide Delivery Across Sri Lanka",
    "💬 Take care of your skin! Free consultation available on WhatsApp",
    "💳 Pay in 3 or 4 installments with Koko, Mintpay & Payzy",
    "✨ 100% Authentic Korean & Luxury Skincare Guaranteed",
    "⚡ Cash on Delivery (COD) Available Nationwide",
  ];

  return (
    <div className="marquee-wrapper">
      <div className="marquee-track">
        {items.concat(items).map((item, idx) => (
          <div key={idx} className="marquee-item">
            <span className="marquee-dot" />
            <p>{item}</p>
          </div>
        ))}
      </div>

      <style jsx>{`
        .marquee-wrapper {
          background: #ffe4e6;
          color: #111827;
          border-bottom: 1px solid rgba(244, 63, 94, 0.15);
          overflow: hidden;
          white-space: nowrap;
          padding: 8px 0;
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .marquee-track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: marquee 28s linear infinite;
        }

        .marquee-track:hover {
          animation-play-state: paused;
        }

        .marquee-item {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          padding: 0 24px;
        }

        .marquee-dot {
          width: 5px;
          height: 5px;
          background-color: #e11d48;
          border-radius: 50%;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
