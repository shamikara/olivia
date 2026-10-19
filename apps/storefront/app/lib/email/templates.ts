import type { Order } from "../order-store";
import { KOKO_SURCHARGE_PERCENT } from "../payments/surcharge";
import { BRAND, button, eyebrow, heading, money, panel, paragraph, siteUrl, wrap } from "./shell";

export interface Email {
  subject: string;
  html: string;
  text: string;
}

/* ------------------------------------------------------------------ welcome */

export function welcomeEmail(name: string): Email {
  const first = name.split(" ")[0];
  return {
    subject: "Welcome to Olivia Glow",
    text: `Hi ${first}, welcome to Olivia Glow. Your account is ready — save a delivery address to check out faster. Use GLOW10 for 10% off your first order. ${siteUrl("/shop")}`,
    html: wrap({
      title: "Welcome to Olivia Glow",
      preview: "Your account is ready — and here's 10% off your first order.",
      body: `
        ${eyebrow("Your account is ready")}
        ${heading(`Welcome, ${first}.`)}
        ${paragraph(
          "You can now save delivery addresses, keep every order in one place, and reorder your favourites in a tap.",
        )}
        ${panel(`
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.inkSoft};">
            <strong style="color:${BRAND.gold};">10% off your first order</strong><br>
            Use code <strong style="font-family:'Courier New',monospace;letter-spacing:1px;">GLOW10</strong> at checkout.
          </div>`)}
        ${button("Start shopping", siteUrl("/shop"))}
        ${paragraph(
          `Not sure where to begin? Message us on WhatsApp and a Colombo advisor will build you a routine from what we actually stock.`,
        )}`,
    }),
  };
}

/* ------------------------------------------------------- order confirmation */

function orderLinesTable(order: Order): string {
  const rows = order.lines
    .map(
      (line) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.line};">
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1.6px;
                      text-transform:uppercase;color:${BRAND.muted};">${line.brand}</div>
          <div style="font-family:Georgia,serif;font-size:14px;color:${BRAND.ink};padding-top:3px;">${line.name}</div>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${BRAND.muted};padding-top:3px;">
            ${line.quantity} × ${money(line.unitPriceLKR)}
          </div>
        </td>
        <td align="right" valign="top"
            style="padding:12px 0;border-bottom:1px solid ${BRAND.line};font-family:'Courier New',monospace;
                   font-size:13px;color:${BRAND.ink};white-space:nowrap;">${money(line.lineTotalLKR)}</td>
      </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, strong = false) => `
    <tr>
      <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:${strong ? 15 : 13}px;
                 color:${strong ? BRAND.ink : BRAND.muted};${strong ? "font-weight:bold;" : ""}">${label}</td>
      <td align="right" style="padding:6px 0;font-family:${strong ? "Georgia,serif" : "'Courier New',monospace"};
                 font-size:${strong ? 19 : 13}px;color:${BRAND.ink};">${value}</td>
    </tr>`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:14px;">
      ${totalRow("Subtotal", money(order.subtotalLKR))}
      ${order.discountLKR > 0 ? totalRow(`Discount${order.discountCode ? ` (${order.discountCode})` : ""}`, `− ${money(order.discountLKR)}`) : ""}
      ${totalRow("Delivery", order.shippingLKR === 0 ? "Free" : money(order.shippingLKR))}
      ${
        order.paymentMethod === "koko"
          ? totalRow(
              `Koko fee (${KOKO_SURCHARGE_PERCENT}%)`,
              money(order.totalLKR - (order.subtotalLKR - order.discountLKR + order.shippingLKR)),
            )
          : ""
      }
      <tr><td colspan="2" style="border-top:1px solid ${BRAND.line};padding-top:8px;"></td></tr>
      ${totalRow("Total", money(order.totalLKR), true)}
    </table>`;
}

export function orderConfirmationEmail(order: Order): Email {
  const first = order.contactName.split(" ")[0];
  const address = order.address
    ? `${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}<br>${order.address.city}${
        order.address.postalCode ? ` ${order.address.postalCode}` : ""
      }<br>${order.address.phone}`
    : "We'll confirm your delivery address on WhatsApp.";

  return {
    subject: `Order ${order.reference} received — Olivia Glow`,
    text: `Hi ${first}, we've received order ${order.reference}. Total ${money(order.totalLKR)}. We'll confirm stock and delivery on WhatsApp before any payment. ${siteUrl(`/order/${order.reference}`)}`,
    html: wrap({
      title: `Order ${order.reference}`,
      preview: `We've got your order — ${money(order.totalLKR)}, reference ${order.reference}.`,
      body: `
        ${eyebrow("Order received")}
        ${heading(`Thank you, ${first}.`)}
        ${paragraph(
          `Your reference is <strong style="color:${BRAND.gold};">${order.reference}</strong>. We'll confirm stock and delivery on WhatsApp before any payment is taken.`,
        )}
        ${orderLinesTable(order)}
        ${panel(`
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1.6px;
                      text-transform:uppercase;color:${BRAND.gold};padding-bottom:8px;">Delivering to</div>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.8;color:${BRAND.inkSoft};">
            ${order.contactName}<br>${address}
          </div>`)}
        ${button("View your order", siteUrl(`/order/${order.reference}`))}
        ${paragraph(
          "Payment is on delivery, by bank transfer, or split into three interest-free instalments with Mintpay, Koko or Payzy.",
        )}`,
    }),
  };
}

/* ------------------------------------------------------------ status update */

const STATUS_COPY: Record<Order["status"], { title: string; line: string }> = {
  pending: { title: "We've got your order", line: "We're confirming stock and will be in touch shortly." },
  confirmed: { title: "Your order is confirmed", line: "Everything is in stock and we're preparing it now." },
  packing: { title: "We're packing your order", line: "Your products are being wrapped and boxed today." },
  shipped: { title: "Your order is on its way", line: "It's with our courier and should reach you in 1–3 working days." },
  delivered: { title: "Your order has arrived", line: "We hope you love it. Tell us how you get on." },
  cancelled: { title: "Your order was cancelled", line: "Nothing has been charged. Message us if this was a mistake." },
};

export function orderStatusEmail(order: Order): Email {
  const copy = STATUS_COPY[order.status];
  const first = order.contactName.split(" ")[0];
  return {
    subject: `${order.reference} — ${copy.title}`,
    text: `Hi ${first}, ${copy.title.toLowerCase()}. ${copy.line} Order ${order.reference}, ${money(order.totalLKR)}. ${siteUrl(`/order/${order.reference}`)}`,
    html: wrap({
      title: copy.title,
      preview: copy.line,
      body: `
        ${eyebrow(`Order ${order.reference}`)}
        ${heading(copy.title)}
        ${paragraph(`Hi ${first} — ${copy.line}`)}
        ${panel(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${BRAND.inkSoft};">
                ${order.lines.length} item${order.lines.length === 1 ? "" : "s"}
              </td>
              <td align="right" style="font-family:Georgia,serif;font-size:17px;color:${BRAND.ink};">
                ${money(order.totalLKR)}
              </td>
            </tr>
          </table>`)}
        ${button("Track this order", siteUrl(`/order/${order.reference}`))}`,
    }),
  };
}

/* -------------------------------------------------------------------- OTP */

export function otpEmail(code: string, minutes: number): Email {
  return {
    subject: `${code} is your Olivia Glow verification code`,
    text: `Your Olivia Glow verification code is ${code}. It expires in ${minutes} minutes. If you didn't request it, ignore this email.`,
    html: wrap({
      title: "Your verification code",
      preview: `${code} — expires in ${minutes} minutes.`,
      body: `
        ${eyebrow("Verification code")}
        ${heading("Here's your code.")}
        ${paragraph("Enter this to continue. It expires shortly, so use it soon.")}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
               style="margin:22px 0;background:${BRAND.plum};border-radius:10px;">
          <tr>
            <td align="center" style="padding:26px 20px;">
              <div style="font-family:'Courier New',monospace;font-size:38px;letter-spacing:12px;
                          color:${BRAND.goldBright};">${code}</div>
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:1.5px;
                          text-transform:uppercase;color:rgba(232,205,191,.55);padding-top:12px;">
                Expires in ${minutes} minutes
              </div>
            </td>
          </tr>
        </table>
        ${paragraph(
          `If you didn't ask for this, you can ignore the email — nothing will change. Never share this code; our team will never ask you for it.`,
        )}`,
    }),
  };
}

/* --------------------------------------------------------- password changed */

export function passwordChangedEmail(name: string): Email {
  const first = name.split(" ")[0];
  return {
    subject: "Your Olivia Glow password was changed",
    text: `Hi ${first}, your password has just been changed. If this wasn't you, contact us immediately.`,
    html: wrap({
      title: "Password changed",
      preview: "Your password has just been changed.",
      body: `
        ${eyebrow("Security")}
        ${heading("Your password was changed.")}
        ${paragraph(`Hi ${first} — this is a confirmation that your password has just been updated.`)}
        ${paragraph(
          `<strong>If this wasn't you</strong>, message us on WhatsApp straight away and we'll secure the account.`,
        )}
        ${button("Go to my account", siteUrl("/account"))}`,
    }),
  };
}


/* ---------------------------------------------------------------- invoice */

const PAYMENT_LABEL: Record<Order["paymentMethod"], string> = {
  cod: "Cash on delivery",
  whatsapp: "Arranged on WhatsApp",
  koko: "Koko — 3 interest-free instalments",
  mintpay: "Mintpay — 3 interest-free instalments",
  paypal: "PayPal",
};

const issuedOn = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

/**
 * The itemised invoice, sent once an order is actually settled — on a
 * successful gateway payment, or on confirmation for cash on delivery.
 *
 * Distinct from the confirmation mail on purpose: that one is sent the moment
 * an order is placed and says nothing has been charged yet, so it cannot
 * double as a record of payment. This one states what was paid, how, and when.
 */
export function invoiceEmail(order: Order): Email {
  const first = order.contactName.split(" ")[0];
  const paid = order.paymentStatus === "paid";

  const billTo = order.address
    ? `${order.address.fullName || order.contactName}<br>${order.address.line1}${
        order.address.line2 ? `<br>${order.address.line2}` : ""
      }<br>${order.address.city}${order.address.postalCode ? ` ${order.address.postalCode}` : ""}<br>${
        order.address.phone
      }`
    : `${order.contactName}<br>${order.contactPhone}`;

  const metaRow = (label: string, value: string) => `
    <tr>
      <td style="padding:4px 0;font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1.6px;
                 text-transform:uppercase;color:${BRAND.muted};">${label}</td>
      <td align="right" style="padding:4px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;
                 color:${BRAND.ink};">${value}</td>
    </tr>`;

  return {
    subject: `Invoice ${order.reference} — Olivia Glow`,
    text:
      `Hi ${first}, here is your invoice for order ${order.reference}, issued ${issuedOn(order.createdAt)}. ` +
      `Total ${money(order.totalLKR)}, paid via ${PAYMENT_LABEL[order.paymentMethod]}. ` +
      `${paid ? "This order is paid in full." : "Payment is due on delivery."} ${siteUrl(`/order/${order.reference}`)}`,
    html: wrap({
      title: `Invoice ${order.reference}`,
      preview: `${money(order.totalLKR)} — ${paid ? "paid in full" : "payable on delivery"}.`,
      body: `
        ${eyebrow("Invoice")}
        ${heading(`Invoice ${order.reference}`)}
        ${paragraph(
          paid
            ? `Thank you, ${first}. This order is <strong style="color:${BRAND.green};">paid in full</strong> — keep this email as your receipt.`
            : `Thank you, ${first}. Payment of <strong>${money(order.totalLKR)}</strong> is due on delivery.`,
        )}
        ${panel(`
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            ${metaRow("Invoice no.", order.reference)}
            ${metaRow("Issued", issuedOn(order.createdAt))}
            ${metaRow("Payment method", PAYMENT_LABEL[order.paymentMethod])}
            ${metaRow("Status", paid ? "Paid" : "Due on delivery")}
            ${order.paidAt ? metaRow("Paid on", issuedOn(order.paidAt)) : ""}
            ${order.transactionId ? metaRow("Transaction", order.transactionId) : ""}
          </table>`)}
        ${orderLinesTable(order)}
        ${panel(`
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1.6px;
                      text-transform:uppercase;color:${BRAND.gold};padding-bottom:8px;">Billed to</div>
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.8;color:${BRAND.inkSoft};">
            ${billTo}
          </div>`)}
        ${button("View your order", siteUrl(`/order/${order.reference}`))}`,
    }),
  };
}

/* ------------------------------------------------- admin password reset */

/**
 * Sent to an administrator who asked to reset their password.
 *
 * The link carries a single-use token that expires; the body says both, so a
 * recipient who did not request it knows the window is short, and one who did
 * knows not to sit on it.
 */
export function adminPasswordResetEmail(name: string, resetUrl: string, minutes: number): Email {
  const first = name.split(" ")[0];
  return {
    subject: "Reset your Olivia Glow admin password",
    text:
      `Hi ${first}, a password reset was requested for your Olivia Glow admin account. ` +
      `Open ${resetUrl} within ${minutes} minutes to choose a new password. ` +
      `The link works once. If you didn't request this, ignore this email — your password is unchanged.`,
    html: wrap({
      title: "Reset your admin password",
      preview: `Choose a new password within ${minutes} minutes.`,
      body: `
        ${eyebrow("Store management")}
        ${heading("Reset your password.")}
        ${paragraph(
          `Hi ${first} — a password reset was requested for your Olivia Glow admin account.`,
        )}
        ${button("Choose a new password", resetUrl)}
        ${panel(`
          <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.8;color:${BRAND.inkSoft};">
            This link expires in <strong>${minutes} minutes</strong> and can be used once.
          </div>`)}
        ${paragraph(
          `<strong>If you didn't request this</strong>, no action is needed — your password has not changed. ` +
            `If it keeps happening, someone knows your admin address.`,
        )}`,
    }),
  };
}
