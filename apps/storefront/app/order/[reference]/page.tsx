import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { StoreShell } from "../../components/StoreShell";
import { findOrderByReference } from "../../lib/order-store";
import { formatLKR } from "../../data/products";
import { SITE, whatsappLink } from "../../lib/site";

export const metadata: Metadata = { title: "Order confirmed" };

export default async function OrderPage({ params }: { params: Promise<{ reference: string }> }) {
  const { reference } = await params;
  const order = await findOrderByReference(reference);
  if (!order) notFound();

  return (
    <StoreShell>
      <header className="page-head has-aura">
        <div className="aura aura-gold" style={{ width: 420, height: 420, top: -180, right: -140 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">Order received</p>
          <h1>
            Thank you, <span className="accent">{order.contactName.split(" ")[0]}.</span>
          </h1>
          <p className="lede">
            Your reference is <strong>{order.reference}</strong>. We&apos;ll confirm stock and delivery on WhatsApp
            before any payment is taken.
          </p>
        </div>
      </header>

      <section className="container section-tight order-confirm">
        <article className="order-card">
          <header>
            <div>
              <b>{order.reference}</b>
              <small>
                {new Date(order.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </small>
            </div>
            <span className="order-status status-pending">Awaiting confirmation</span>
          </header>

          <div className="order-lines">
            {order.lines.map((line) => (
              <div className="order-line" key={line.productId}>
                <img src={line.image} alt="" />
                <div>
                  <small>{line.brand}</small>
                  <p>{line.name}</p>
                </div>
                <span className="mono">
                  {line.quantity} × {formatLKR(line.unitPriceLKR)}
                </span>
              </div>
            ))}
          </div>

          <div className="order-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <strong>{formatLKR(order.subtotalLKR)}</strong>
            </div>
            {order.discountLKR > 0 && (
              <div className="summary-row" style={{ color: "var(--green)" }}>
                <span>Discount {order.discountCode ? `(${order.discountCode})` : ""}</span>
                <strong>−{formatLKR(order.discountLKR)}</strong>
              </div>
            )}
            <div className="summary-row">
              <span>Delivery</span>
              <strong>{order.shippingLKR === 0 ? "Free" : formatLKR(order.shippingLKR)}</strong>
            </div>
            <div className="summary-row summary-total">
              <span>Total</span>
              <strong>{formatLKR(order.totalLKR)}</strong>
            </div>
          </div>
        </article>

        <div className="order-next">
          <h3>What happens next</h3>
          <p className="muted">
            We check stock, confirm your delivery address and give you a total including any delivery charge. Payment is
            on delivery, by bank transfer, or split into three with Mintpay, Koko or Payzy.
          </p>
          <a
            className="btn btn-whatsapp"
            href={whatsappLink(`Hi Olivia Glow, I'd like to follow up on order ${order.reference}.`)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Message us about {order.reference}
          </a>
          <Link href="/shop" className="link-underline" style={{ marginTop: 18 }}>
            Continue shopping →
          </Link>
          <p className="muted" style={{ fontSize: "0.72rem", marginTop: 18 }}>
            Free delivery over {formatLKR(SITE.freeShippingThreshold)} · Islandwide in 1–3 working days
          </p>
        </div>
      </section>
    </StoreShell>
  );
}
