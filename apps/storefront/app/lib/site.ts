export const SITE = {
  name: "Olivia Glow",
  tagline: "K-Beauty & Luxury Skincare",
  description:
    "Sri Lanka's destination for authentic Korean skincare, clinical beauty devices and barrier-repair rituals. Islandwide delivery, cash on delivery and 3-month installments.",
  logo: "/images/olivia-glow-logo.jpeg",
  whatsapp: "https://wa.me/message/RXH3PJIFMXAEP1",
  /*
   * WhatsApp only carries a prefilled message on the wa.me/<number> form; the
   * wa.me/message/<code> short link above drops ?text= entirely. Put the store
   * number here in international format, digits only (e.g. "94771234567") and
   * order details will land in the chat automatically. Left empty, checkout
   * falls back to the short link plus a copy-to-clipboard button.
   */
  whatsappPhone: "",
  instagram: "https://www.instagram.com/oliviaglow.lk?utm_source=qr",
  tiktok: "https://www.tiktok.com/@oliviaglow41?_r=1&_t=ZS-98MOQHA4s9l",
  facebook: "https://www.facebook.com/share/1DB3Bx18WX/?mibextid=wwXIfr",
  freeShippingThreshold: 15000,
  installmentMonths: 3,
} as const;

/** Builds a WhatsApp link that actually carries `message`, when possible. */
export function whatsappLink(message?: string): string {
  if (!message || !SITE.whatsappPhone) return SITE.whatsapp;
  return `https://wa.me/${SITE.whatsappPhone}?text=${encodeURIComponent(message)}`;
}

/** True when a prefilled message will survive the trip into WhatsApp. */
export const canPrefillWhatsApp = SITE.whatsappPhone.length > 0;

export const ANNOUNCEMENTS = [
  "10% off your first order with code GLOW10",
  "Islandwide delivery · Cash on delivery available",
  "100% authentic K-Beauty, sourced direct",
  "Pay in 3 with Mintpay, Koko & Payzy",
  "Free skin consultation on WhatsApp",
];

export const NAV_LINKS = [
  { href: "/shop", label: "Shop all" },
  { href: "/shop?category=SERUM", label: "Serums" },
  { href: "/shop?category=MOISTURIZERS", label: "Moisturisers" },
  { href: "/shop?category=DEVICE", label: "Beauty tech" },
  { href: "/brands", label: "Brands" },
];
