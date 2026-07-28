export interface BeautyProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  priceLKR: number;
  originalPriceLKR?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  secondaryImage: string;
  tag?: string;
  stockCount?: number;
  viewersCount?: number;
  description: string;
  benefits: string[];
}

export const PRODUCTS_CATALOG: BeautyProduct[] = [
  {
    id: "prod-01",
    name: "Medicube Mini Booster Pro Plus Full Facial Device Set",
    brand: "Medicube",
    category: "DEVICE",
    priceLKR: 87000,
    originalPriceLKR: 95700,
    rating: 4.9,
    reviewsCount: 328,
    image: "/images/device_hero.png",
    secondaryImage: "/images/hero_cover.png",
    tag: "BESTSELLER • 10% OFF",
    stockCount: 4,
    viewersCount: 38,
    description: "6-in-1 total facial care device for electroporation, microcurrent, EMS, electric needle, and LED therapy. Clinically proven to boost skin absorption by 473%.",
    benefits: ["Pore Elasticity", "Radiance Booster", "Deep Absorption", "Collagen Tightening"],
  },
  {
    id: "prod-02",
    name: "Olivia Glow Morning Dew Hydration Serum (50ml)",
    brand: "Olivia Glow",
    category: "SERUM",
    priceLKR: 8400,
    originalPriceLKR: 9800,
    rating: 5.0,
    reviewsCount: 214,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    tag: "VIRAL GLOW • SIGNATURE",
    stockCount: 8,
    viewersCount: 52,
    description: "Triple molecular hyaluronic acid with 5% Niacinamide and Botanical Squalane for instant glass skin radiance and 24-hour hydration.",
    benefits: ["Instant Hydration", "Brightening", "Skin Barrier Balance"],
  },
  {
    id: "prod-03",
    name: "Beauty of Joseon Relief Sun : Rice + Probiotics SPF50+ PA++++",
    brand: "Beauty of Joseon",
    category: "SUN CREAM",
    priceLKR: 4950,
    originalPriceLKR: 5600,
    rating: 5.0,
    reviewsCount: 512,
    image: "https://cdn.greencloudpos.com/hibeauty.lk/product/medicube-zero-pore-blackhead-mud-mask-1779608027971.jpeg?width=800",
    secondaryImage: "/images/serum_hero.png",
    tag: "TOP RATED",
    stockCount: 12,
    viewersCount: 29,
    description: "Lightweight organic sun cream enriched with 30% rice extract and grain probiotics for dewy protection without white cast.",
    benefits: ["Zero White Cast", "Deep Hydration", "Broad Spectrum Protection"],
  },
  {
    id: "prod-04",
    name: "Medicube Zero Pore Blackhead Mud Mask (100g)",
    brand: "Medicube",
    category: "FACE MASK",
    priceLKR: 6800,
    originalPriceLKR: 7500,
    rating: 4.8,
    reviewsCount: 142,
    image: "https://cdn.greencloudpos.com/hibeauty.lk/product/medicube-zero-pore-blackhead-mud-mask-1779608027971.jpeg?width=800",
    secondaryImage: "/images/device_hero.png",
    tag: "PORE CLEARING",
    stockCount: 6,
    viewersCount: 19,
    description: "Deep pore cleansing mud mask infused with kaolin clay and BHA to dissolve blackheads and refine skin texture.",
    benefits: ["Blackhead Removal", "Sebum Control", "Pore Minimizing"],
  },
  {
    id: "prod-05",
    name: "COSRX Advanced Snail 96 Mucin Power Essence (100ml)",
    brand: "COSRX",
    category: "SERUM",
    priceLKR: 5200,
    originalPriceLKR: 6100,
    rating: 4.9,
    reviewsCount: 640,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    tag: "HOLY GRAIL",
    stockCount: 15,
    viewersCount: 64,
    description: "Lightweight essence formulated with 96% snail secretion filtrate to soothe, repair, and plump dry skin.",
    benefits: ["Skin Repair", "Barrier Strengthening", "Glass Skin Glow"],
  },
  {
    id: "prod-06",
    name: "Anua Heartleaf 77% Soothing Toner (250ml)",
    brand: "Anua",
    category: "TONER",
    priceLKR: 6400,
    originalPriceLKR: 7200,
    rating: 4.8,
    reviewsCount: 285,
    image: "https://cdn.greencloudpos.com/hibeauty.lk/product/medicube-zero-pore-blackhead-mud-mask-1779608027971.jpeg?width=800",
    secondaryImage: "/images/serum_hero.png",
    tag: "ACNE SOOTHING",
    stockCount: 9,
    viewersCount: 31,
    description: "Formulated with 77% Heartleaf extract to calm redness, soothe acne inflammation, and balance moisture.",
    benefits: ["Redness Relief", "pH Balancing", "Gentle Exfoliation"],
  },
  {
    id: "prod-07",
    name: "Olivia Glow Cloud Milk Cleanser (150ml)",
    brand: "Olivia Glow",
    category: "CLEANSER",
    priceLKR: 5600,
    originalPriceLKR: 6400,
    rating: 4.9,
    reviewsCount: 176,
    image: "/images/hero_cover.png",
    secondaryImage: "/images/serum_hero.png",
    tag: "GENTLE CARE",
    stockCount: 11,
    viewersCount: 24,
    description: "Creamy pH-balanced cleansing milk enriched with oat extract and ceramide complex that cleanses without stripping.",
    benefits: ["Non-Stripping", "Soothes Sensitivity", "Removes Makeup"],
  },
  {
    id: "prod-08",
    name: "Olivia Glow Velvet Barrier Moisturizing Cream (50g)",
    brand: "Olivia Glow",
    category: "MOISTURIZERS",
    priceLKR: 7500,
    originalPriceLKR: 8800,
    rating: 4.9,
    reviewsCount: 192,
    image: "/images/hero_cover.png",
    secondaryImage: "/images/serum_hero.png",
    tag: "BARRIER REPAIR",
    stockCount: 7,
    viewersCount: 45,
    description: "Rich lipid moisture cream with 5 Ceramides, Fatty Acids, and Centella to lock in moisture for 48 hours.",
    benefits: ["48H Hydration", "Restores Skin Barrier", "Smooth Velvet Finish"],
  },
];

export const CATEGORIES = [
  "NEW ARRIVALS",
  "MOISTURIZERS",
  "SERUM",
  "CLEANSER",
  "TONER",
  "SUN CREAM",
  "FACE MASK",
  "HAIR CARE",
  "DEVICE",
];

export const FEATURED_BRANDS = [
  { name: "Medicube", logo: "M" },
  { name: "Beauty of Joseon", logo: "BOJ" },
  { name: "COSRX", logo: "CX" },
  { name: "Anua", logo: "AN" },
  { name: "Dr.G", logo: "DRG" },
  { name: "Skin1004", logo: "1004" },
  { name: "Olivia Glow", logo: "OG" },
];

export function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateInstallment(price: number, months: number = 3): string {
  const perMonth = price / months;
  return formatLKR(perMonth);
}
