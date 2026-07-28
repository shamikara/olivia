export interface BeautyProduct {
  id: string;
  name: string;
  brand: string;
  category: "SERUM" | "MOISTURIZERS" | "DEVICE" | "SUN CREAM" | "TONER";
  priceLKR: number;
  originalPriceLKR?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  secondaryImage: string;
  description: string;
  benefits: string[];
  stockCount: number;
  viewersCount: number;
  tag?: string;
}

export const PRODUCTS_CATALOG: BeautyProduct[] = [
  {
    id: "prod-01",
    name: "Medicube AGE-R Booster Pro 6-in-1 Beauty Tech Device",
    brand: "Medicube",
    category: "DEVICE",
    priceLKR: 87000,
    originalPriceLKR: 96000,
    rating: 4.9,
    reviewsCount: 128,
    image: "/images/device_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description: "The ultimate 6-in-1 Korean facial device featuring Electroporation, Microcurrent, EMS, and Electric Needling for needle-free glow and absorption boost.",
    benefits: [
      "490% deeper skin absorption",
      "Pore tightening & elastic contouring",
      "Clinical LED light therapy mode",
      "App-controlled Bluetooth custom routines"
    ],
    stockCount: 3,
    viewersCount: 48,
    tag: "BESTSELLER"
  },
  {
    id: "prod-02",
    name: "Olivia Glow Morning Dew Hydrating Barrier Serum 50ml",
    brand: "Olivia Glow",
    category: "SERUM",
    priceLKR: 8400,
    originalPriceLKR: 9800,
    rating: 4.95,
    reviewsCount: 86,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description: "Consciously formulated barrier serum enriched with Quadruple Hyaluronic Complex, Centella Asiatica, and Squalane for instant glass skin dewiness.",
    benefits: [
      "Instant 24-hour hydration barrier",
      "Calms redness & post-acne irritation",
      "Lightweight silk texture absorbs in 5 seconds",
      "100% Vegan & Hypoallergenic"
    ],
    stockCount: 8,
    viewersCount: 36,
    tag: "10% OFF"
  },
  {
    id: "prod-03",
    name: "Medicube Turmeric Vitamin Gold Jelly Mist Serum 100ml",
    brand: "Medicube",
    category: "SERUM",
    priceLKR: 9427,
    originalPriceLKR: 10800,
    rating: 4.8,
    reviewsCount: 64,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/device_hero.png",
    description: "Radiance boosting jelly mist serum with Turmeric Extract and Vitamin C to fade hyperpigmentation and reveal glowing, even skin tone.",
    benefits: [
      "Fades dark spots & sun hyperpigmentation",
      "Fine mist spray over makeup or bare skin",
      "Antioxidant shield against urban pollution"
    ],
    stockCount: 5,
    viewersCount: 29,
    tag: "POPULAR"
  },
  {
    id: "prod-04",
    name: "Medicube AGE-R Glutathione Glow Capsule Cream 50ml",
    brand: "Medicube",
    category: "MOISTURIZERS",
    priceLKR: 9224,
    originalPriceLKR: 10500,
    rating: 4.85,
    reviewsCount: 72,
    image: "/images/hero_cover.png",
    secondaryImage: "/images/serum_hero.png",
    description: "Encapsulated Glutathione and Niacinamide moisture cream engineered for intense skin whitening, spot correction, and glass skin finish.",
    benefits: [
      "Pristine Glutathione capsules melt into skin",
      "Protects collagen & tightens skin texture",
      "Non-greasy satin moisture barrier"
    ],
    stockCount: 6,
    viewersCount: 42,
    tag: "NEW"
  },
  {
    id: "prod-05",
    name: "Anua Azelaic 10 Hyaluron Redness Soothing Pads 70 Pcs",
    brand: "Anua",
    category: "TONER",
    priceLKR: 8802,
    originalPriceLKR: 9900,
    rating: 4.9,
    reviewsCount: 94,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description: "Calming toner pads infused with 10% Azelaic Acid and Hyaluronic Acid to rapidly soothe active breakout redness and refine skin texture.",
    benefits: [
      "Reduces redness & inflammatory breakouts",
      "Exfoliates dead skin cells gently without peeling",
      "Dual-sided cotton pads for targeted skin pack"
    ],
    stockCount: 12,
    viewersCount: 31,
    tag: "VIRAL FAV"
  },
  {
    id: "prod-06",
    name: "Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+ 50ml",
    brand: "Beauty of Joseon",
    category: "SUN CREAM",
    priceLKR: 5900,
    originalPriceLKR: 6800,
    rating: 4.98,
    reviewsCount: 210,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/device_hero.png",
    description: "Lightweight organic chemical sunscreen enriched with 30% Rice Extract and Grain Probiotics for zero white cast and velvety hydration.",
    benefits: [
      "Broad Spectrum SPF50+ PA++++ protection",
      "Zero white cast or sticky residue",
      "Featherlight moist finish ideal under makeup"
    ],
    stockCount: 15,
    viewersCount: 65,
    tag: "HOLY GRAIL"
  },
  {
    id: "prod-07",
    name: "COSRX Advanced Snail 96 Mucin Power Essence 100ml",
    brand: "COSRX",
    category: "SERUM",
    priceLKR: 6850,
    originalPriceLKR: 7800,
    rating: 4.92,
    reviewsCount: 340,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description: "Formulated with 96.3% Snail Secretion Filtrate, this light essence repairs damaged barrier, restores elasticity, and locks in deep moisture.",
    benefits: [
      "Fades dark acne scars & smooths roughness",
      "Soothes sensitive, dehydrated skin",
      "Clean snail mucin filtered cruelty-free"
    ],
    stockCount: 10,
    viewersCount: 52,
    tag: "BESTSELLER"
  },
  {
    id: "prod-08",
    name: "Skin1004 Madagascar Centella Soothing Cream 75ml",
    brand: "Skin1004",
    category: "MOISTURIZERS",
    priceLKR: 6400,
    originalPriceLKR: 7200,
    rating: 4.87,
    reviewsCount: 88,
    image: "/images/hero_cover.png",
    secondaryImage: "/images/serum_hero.png",
    description: "Quadruple Ceramide barrier cream with pure Centella Asiatica harvested from Madagascar to strengthen fragile skin barriers.",
    benefits: [
      "Restores damaged skin barrier in 7 days",
      "Light gel-cream texture for tropical climates",
      "Non-comedogenic & dermatologically tested"
    ],
    stockCount: 7,
    viewersCount: 24,
    tag: "BARRIER CARE"
  }
];

export const CATEGORIES = ["SERUM", "MOISTURIZERS", "DEVICE", "SUN CREAM", "TONER"];

export const FEATURED_BRANDS = [
  { name: "Medicube", logo: "/images/brand_logo.png" },
  { name: "Olivia Glow", logo: "/images/olivia-glow-logo.jpeg" },
  { name: "Beauty of Joseon", logo: "/images/brand_logo.png" },
  { name: "Anua", logo: "/images/brand_logo.png" },
  { name: "COSRX", logo: "/images/brand_logo.png" },
  { name: "Skin1004", logo: "/images/brand_logo.png" }
];

export function formatLKR(amount: number): string {
  return `LKR ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function calculateInstallment(amount: number, months: number = 3): string {
  const monthly = amount / months;
  return formatLKR(monthly);
}
