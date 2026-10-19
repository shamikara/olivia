import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAdmin } from "../../../lib/admin-auth";
import { isEmailConfigured, sendEmail } from "../../../lib/email/send";
import {
  invoiceEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  otpEmail,
  passwordChangedEmail,
  welcomeEmail,
  type Email,
} from "../../../lib/email/templates";
import type { Order } from "../../../lib/order-store";

export const dynamic = "force-dynamic";

/**
 * Admin-side view of the transactional mail.
 *
 * Templates are code, not content the shop edits, so this exposes what the
 * shop actually needs: which mails exist, when each one fires, whether
 * outbound mail is configured at all, and a way to send a real one to yourself
 * before a customer is the first person to see it.
 *
 * Previews render against the sample order below rather than real data — an
 * admin checking a layout has no business pulling a customer's order into it.
 */

const SAMPLE_ORDER: Order = {
  id: "ord_sample000000",
  reference: "OG-1042",
  contactName: "Nimali Perera",
  contactPhone: "0771234567",
  contactEmail: "nimali@example.com",
  lines: [
    {
      productId: "p1",
      name: "ANUA Niacinamide 10 + TXA 4 Serum",
      brand: "Anua",
      image: "",
      quantity: 1,
      unitPriceLKR: 8580,
      lineTotalLKR: 8580,
    },
    {
      productId: "p46",
      name: "Anua Azelaic 10 Hyaluron Redness Soothing Pad",
      brand: "Anua",
      image: "",
      quantity: 2,
      unitPriceLKR: 8802,
      lineTotalLKR: 17604,
    },
  ],
  subtotalLKR: 26184,
  discountLKR: 2618,
  shippingLKR: 0,
  totalLKR: 23566,
  discountCode: "GLOW10",
  address: {
    id: "adr_sample",
    label: "Home",
    fullName: "Nimali Perera",
    phone: "0771234567",
    line1: "42 Galle Road",
    city: "Colombo 03",
    postalCode: "00300",
    isDefault: true,
  },
  status: "confirmed",
  createdAt: new Date().toISOString(),
  paymentMethod: "koko",
  paymentStatus: "paid",
  transactionId: "KK-SAMPLE-88412",
  paymentEvidence: "signed-callback",
  paidAt: new Date().toISOString(),
};

interface TemplateDef {
  key: string;
  label: string;
  /** When this mail actually fires, so the shop knows what it is looking at. */
  trigger: string;
  render: () => Email;
}

const TEMPLATES: TemplateDef[] = [
  {
    key: "welcome",
    label: "Welcome",
    trigger: "A customer creates an account.",
    render: () => welcomeEmail("Nimali Perera"),
  },
  {
    key: "order-confirmation",
    label: "Order confirmation",
    trigger: "An order is placed, before any payment is taken.",
    render: () => orderConfirmationEmail(SAMPLE_ORDER),
  },
  {
    key: "invoice",
    label: "Invoice",
    trigger: "A gateway payment settles, or the shop confirms a cash-on-delivery order.",
    render: () => invoiceEmail(SAMPLE_ORDER),
  },
  {
    key: "order-status",
    label: "Status update",
    trigger: "The shop moves an order to packing, shipped, delivered or cancelled.",
    render: () => orderStatusEmail({ ...SAMPLE_ORDER, status: "shipped" }),
  },
  {
    key: "otp",
    label: "One-time code",
    trigger: "A customer requests a sign-in or verification code.",
    render: () => otpEmail("483920", 10),
  },
  {
    key: "password-changed",
    label: "Password changed",
    trigger: "A customer's password is updated.",
    render: () => passwordChangedEmail("Nimali Perera"),
  },
];

const find = (key: string) => TEMPLATES.find((template) => template.key === key);

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  const key = request.nextUrl.searchParams.get("template");
  if (key) {
    const template = find(key);
    if (!template) return NextResponse.json({ error: "Unknown template" }, { status: 404 });
    const email = template.render();
    return NextResponse.json({ key: template.key, subject: email.subject, html: email.html, text: email.text });
  }

  return NextResponse.json({
    configured: isEmailConfigured(),
    from: process.env.EMAIL_FROM ?? "",
    templates: TEMPLATES.map(({ key, label, trigger, render }) => ({
      key,
      label,
      trigger,
      subject: render().subject,
    })),
  });
}

/** Sends one template to a nominated address, so a layout can be checked for real. */
export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  let body: { template?: string; to?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const template = find(body.template ?? "");
  if (!template) return NextResponse.json({ error: "Unknown template" }, { status: 404 });

  const to = (body.to ?? "").trim();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 422 });
  }

  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: "Outbound mail is not configured — set RESEND_API_KEY and EMAIL_FROM" },
      { status: 503 },
    );
  }

  const sent = await sendEmail(to, template.render());
  if (!sent) {
    return NextResponse.json({ error: "Resend rejected the message — check the server log" }, { status: 502 });
  }

  return NextResponse.json({ ok: true, to });
}
