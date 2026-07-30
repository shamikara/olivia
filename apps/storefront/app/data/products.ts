export type Category = "SERUM" | "MOISTURIZERS" | "DEVICE" | "SUN CREAM" | "TONER";

export interface BeautyProduct {
  id: string;
  name: string;
  shortName: string;
  brand: string;
  category: Category;
  size: string;
  priceLKR: number;
  originalPriceLKR?: number;
  rating: number;
  reviewsCount: number;
  image: string;
  secondaryImage: string;
  description: string;
  benefits: string[];
  concerns: string[];
  howToUse: string;
  keyIngredients: string;
  stockCount: number;
  viewersCount: number;
  tag?: string;
  bestseller?: boolean;
}

export const PRODUCTS_CATALOG: BeautyProduct[] = [
  {
    id: "prod-01",
    name: "Medicube AGE-R Booster Pro 6-in-1 Beauty Device",
    shortName: "AGE-R Booster Pro",
    brand: "Medicube",
    category: "DEVICE",
    size: "1 device",
    priceLKR: 87000,
    originalPriceLKR: 96000,
    rating: 4.9,
    reviewsCount: 128,
    image: "/images/device_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description:
      "The 6-in-1 Korean facial device that turned home skincare into a clinic ritual. Electroporation, microcurrent, EMS and electric needling work together for needle-free lifting and dramatically deeper absorption.",
    benefits: [
      "Up to 490% deeper serum absorption",
      "Visible pore tightening and contour lift",
      "Clinical LED light therapy mode",
      "App-controlled routines over Bluetooth",
    ],
    concerns: ["Firmness", "Pores", "Anti-ageing"],
    howToUse:
      "Cleanse, apply your serum, then glide the device across each zone for 3 minutes per mode. Use 3–4 times a week.",
    keyIngredients: "Medical-grade stainless steel conductive head, 4 treatment modes, LED array",
    stockCount: 3,
    viewersCount: 48,
    tag: "Bestseller",
    bestseller: true,
  },
  {
    id: "prod-02",
    name: "Olivia Glow Morning Dew Hydrating Barrier Serum",
    shortName: "Morning Dew Serum",
    brand: "Olivia Glow",
    category: "SERUM",
    size: "50 ml",
    priceLKR: 8400,
    originalPriceLKR: 9800,
    rating: 4.95,
    reviewsCount: 86,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/olivia-hero.png",
    description:
      "Our house serum, formulated for humid Sri Lankan skin. A quadruple hyaluronic complex, centella and squalane cushion the barrier and leave that glass-skin finish within minutes.",
    benefits: [
      "24-hour hydration you can feel by morning",
      "Calms redness and post-acne irritation",
      "Silk texture that absorbs in seconds",
      "100% vegan and hypoallergenic",
    ],
    concerns: ["Dryness", "Glass skin", "Sensitivity"],
    howToUse:
      "Press 2–3 drops into damp skin morning and night, before moisturiser. Layer a fourth drop on dry patches.",
    keyIngredients: "Quadruple hyaluronic acid, Centella Asiatica, squalane, panthenol",
    stockCount: 8,
    viewersCount: 36,
    tag: "Favourite",
    bestseller: true,
  },
  {
    id: "prod-03",
    name: "Medicube Turmeric Vitamin Gold Jelly Mist Serum",
    shortName: "Turmeric Gold Jelly Mist",
    brand: "Medicube",
    category: "SERUM",
    size: "100 ml",
    priceLKR: 9427,
    originalPriceLKR: 10800,
    rating: 4.8,
    reviewsCount: 64,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/device_hero.png",
    description:
      "A radiance mist that behaves like a serum. Turmeric extract and stabilised vitamin C fade pigmentation and even out tone, with a fine jelly spray you can use over makeup.",
    benefits: [
      "Fades dark spots and sun pigmentation",
      "Mists beautifully over makeup",
      "Antioxidant shield against pollution",
    ],
    concerns: ["Dark spots", "Dullness", "Uneven tone"],
    howToUse: "Hold 20 cm from the face and mist 2–3 times whenever skin needs a lift. Safe over makeup.",
    keyIngredients: "Turmeric extract, vitamin C derivative, niacinamide",
    stockCount: 5,
    viewersCount: 29,
    tag: "Trending",
  },
  {
    id: "prod-04",
    name: "Medicube Glutathione Glow Capsule Cream",
    shortName: "Glutathione Glow Cream",
    brand: "Medicube",
    category: "MOISTURIZERS",
    size: "50 ml",
    priceLKR: 9224,
    originalPriceLKR: 10500,
    rating: 4.85,
    reviewsCount: 72,
    image: "/images/hero_cover.png",
    secondaryImage: "/images/serum_hero.png",
    description:
      "Encapsulated glutathione melts into skin the moment you press it in. Paired with niacinamide for brightening, spot correction and a satin, never-greasy finish.",
    benefits: [
      "Visible glutathione capsules melt on contact",
      "Protects collagen and refines texture",
      "Non-greasy satin moisture barrier",
    ],
    concerns: ["Brightening", "Dark spots", "Firmness"],
    howToUse: "Warm a pearl-sized amount and press over the face as the final step of your evening routine.",
    keyIngredients: "Encapsulated glutathione, niacinamide, ceramide NP",
    stockCount: 6,
    viewersCount: 42,
    tag: "New in",
  },
  {
    id: "prod-05",
    name: "Anua Azelaic 10 Hyaluron Redness Soothing Pads",
    shortName: "Azelaic 10 Soothing Pads",
    brand: "Anua",
    category: "TONER",
    size: "70 pads",
    priceLKR: 8802,
    originalPriceLKR: 9900,
    rating: 4.9,
    reviewsCount: 94,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description:
      "10% azelaic acid with hyaluronic acid on dual-textured cotton pads. The fastest way to bring an angry breakout back down without stripping the barrier.",
    benefits: [
      "Calms active breakouts and redness",
      "Gentle daily exfoliation, no peeling",
      "Dual-sided pads for sweeping and packing",
    ],
    concerns: ["Acne", "Redness", "Texture"],
    howToUse: "Sweep the embossed side over cleansed skin, then leave a pad on stubborn areas for 3 minutes.",
    keyIngredients: "10% azelaic acid, hyaluronic acid, heartleaf extract",
    stockCount: 12,
    viewersCount: 31,
    tag: "Viral",
    bestseller: true,
  },
  {
    id: "prod-06",
    name: "Beauty of Joseon Relief Sun: Rice + Probiotics SPF50+",
    shortName: "Relief Sun SPF50+",
    brand: "Beauty of Joseon",
    category: "SUN CREAM",
    size: "50 ml",
    priceLKR: 5900,
    originalPriceLKR: 6800,
    rating: 4.98,
    reviewsCount: 210,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/device_hero.png",
    description:
      "The sunscreen that converted everyone who hated sunscreen. 30% rice extract and grain probiotics give SPF50+ PA++++ protection with zero white cast and a dewy finish.",
    benefits: [
      "Broad spectrum SPF50+ PA++++",
      "No white cast on any skin tone",
      "Featherlight under makeup",
    ],
    concerns: ["Sun protection", "Dullness", "Daily care"],
    howToUse: "Apply two finger-lengths as the last step of your morning routine. Reapply every 3 hours outdoors.",
    keyIngredients: "30% rice extract, grain probiotics, niacinamide",
    stockCount: 15,
    viewersCount: 65,
    tag: "Holy grail",
    bestseller: true,
  },
  {
    id: "prod-07",
    name: "COSRX Advanced Snail 96 Mucin Power Essence",
    shortName: "Snail 96 Essence",
    brand: "COSRX",
    category: "SERUM",
    size: "100 ml",
    priceLKR: 6850,
    originalPriceLKR: 7800,
    rating: 4.92,
    reviewsCount: 340,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description:
      "96.3% snail secretion filtrate in a light, bouncy essence. It repairs a damaged barrier, softens old acne marks and restores the kind of bounce you notice in photos.",
    benefits: [
      "Fades acne scarring and rough patches",
      "Soothes sensitised, dehydrated skin",
      "Cruelty-free filtered mucin",
    ],
    concerns: ["Acne scars", "Barrier repair", "Dryness"],
    howToUse: "Pat 2 pumps over toner, morning and night. Follow with moisturiser to seal.",
    keyIngredients: "96.3% snail secretion filtrate, sodium hyaluronate, allantoin",
    stockCount: 10,
    viewersCount: 52,
    tag: "Bestseller",
    bestseller: true,
  },
  {
    id: "prod-08",
    name: "Skin1004 Madagascar Centella Soothing Cream",
    shortName: "Centella Soothing Cream",
    brand: "Skin1004",
    category: "MOISTURIZERS",
    size: "75 ml",
    priceLKR: 6400,
    originalPriceLKR: 7200,
    rating: 4.87,
    reviewsCount: 88,
    image: "/images/hero_cover.png",
    secondaryImage: "/images/serum_hero.png",
    description:
      "Quadruple ceramides and pure Madagascar centella in a gel-cream built for tropical humidity. Fragile, over-exfoliated barriers settle within a week.",
    benefits: [
      "Rebuilds a damaged barrier in 7 days",
      "Gel-cream texture made for humid climates",
      "Non-comedogenic, dermatologically tested",
    ],
    concerns: ["Barrier repair", "Sensitivity", "Redness"],
    howToUse: "Smooth over serum morning and night. Use as a 10-minute sleeping mask when skin feels tight.",
    keyIngredients: "Centella Asiatica extract, 4 ceramides, madecassoside",
    stockCount: 7,
    viewersCount: 24,
    tag: "Barrier care",
  },
  {
    id: "prod-09",
    name: "Anua Heartleaf 77% Soothing Toner",
    shortName: "Heartleaf 77 Toner",
    brand: "Anua",
    category: "TONER",
    size: "250 ml",
    priceLKR: 7250,
    originalPriceLKR: 8100,
    rating: 4.91,
    reviewsCount: 176,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/olivia-hero.png",
    description:
      "77% heartleaf water in place of plain water. A weightless toner that takes heat and reactivity out of the skin the moment it goes on.",
    benefits: [
      "Instantly calms heat and reactivity",
      "Preps skin so serums absorb better",
      "Zero fragrance, zero essential oils",
    ],
    concerns: ["Redness", "Sensitivity", "Pores"],
    howToUse: "Pat over cleansed skin with your hands, or soak a cotton pad for a 5-minute calming compress.",
    keyIngredients: "77% Houttuynia cordata extract, panthenol, betaine",
    stockCount: 14,
    viewersCount: 38,
  },
  {
    id: "prod-10",
    name: "Beauty of Joseon Glow Serum Propolis + Niacinamide",
    shortName: "Glow Serum Propolis",
    brand: "Beauty of Joseon",
    category: "SERUM",
    size: "30 ml",
    priceLKR: 6300,
    rating: 4.88,
    reviewsCount: 142,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/hero_cover.png",
    description:
      "60% propolis extract with 2% niacinamide — honey-textured, deeply nourishing, and the reason so many people describe their skin as 'lit from inside'.",
    benefits: [
      "Feeds dull, tired skin overnight",
      "Antibacterial support for breakout-prone skin",
      "Leaves a natural, non-sticky sheen",
    ],
    concerns: ["Dullness", "Acne", "Glass skin"],
    howToUse: "Apply 3–4 drops after toner. Best used at night, or in the morning under sunscreen.",
    keyIngredients: "60% propolis extract, 2% niacinamide",
    stockCount: 9,
    viewersCount: 41,
  },
  {
    id: "prod-11",
    name: "Skin1004 Poremizing Clear Sun Gel SPF50+",
    shortName: "Poremizing Sun Gel",
    brand: "Skin1004",
    category: "SUN CREAM",
    size: "50 ml",
    priceLKR: 5450,
    originalPriceLKR: 6200,
    rating: 4.83,
    reviewsCount: 97,
    image: "/images/hero_cover.png",
    secondaryImage: "/images/serum_hero.png",
    description:
      "A blurring sun gel for oily and combination skin. It sets to a soft-matte finish that keeps shine down through a full Colombo afternoon.",
    benefits: [
      "Soft-matte finish that controls shine",
      "Blurs the look of enlarged pores",
      "Refreshingly light water-gel texture",
    ],
    concerns: ["Oiliness", "Pores", "Sun protection"],
    howToUse: "Apply generously each morning as your final step, before makeup.",
    keyIngredients: "Centella Asiatica, zinc PCA, SPF50+ PA++++ filters",
    stockCount: 11,
    viewersCount: 27,
  },
  {
    id: "prod-12",
    name: "Medicube Zero Pore Pad 2.0",
    shortName: "Zero Pore Pad 2.0",
    brand: "Medicube",
    category: "TONER",
    size: "70 pads",
    priceLKR: 9950,
    originalPriceLKR: 11400,
    rating: 4.86,
    reviewsCount: 118,
    image: "/images/serum_hero.png",
    secondaryImage: "/images/device_hero.png",
    description:
      "Gentle AHA, BHA and PHA on textured pads that sweep out congestion without the sting. Two or three nights a week is all it takes.",
    benefits: [
      "Clears blackheads and congestion",
      "Refines the look of stretched pores",
      "Triple acid blend, low irritation",
    ],
    concerns: ["Pores", "Texture", "Blackheads"],
    howToUse: "Sweep over cleansed dry skin 2–3 nights a week, then follow with a calming toner and moisturiser.",
    keyIngredients: "AHA, BHA, PHA blend with tea tree and panthenol",
    stockCount: 4,
    viewersCount: 55,
    tag: "Low stock",
  },
];

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "SERUM", label: "Serums & essences" },
  { value: "MOISTURIZERS", label: "Moisturisers" },
  { value: "TONER", label: "Toners & pads" },
  { value: "SUN CREAM", label: "Sun care" },
  { value: "DEVICE", label: "Beauty tech" },
];

export const SKIN_GOALS = [
  { icon: "✦", title: "Glass skin", copy: "Dewy hyaluronic and niacinamide serums", category: "SERUM" as Category },
  { icon: "◈", title: "Barrier repair", copy: "Ceramide and snail mucin recovery", category: "MOISTURIZERS" as Category },
  { icon: "◌", title: "Pores & acne", copy: "Heartleaf and azelaic calming pads", category: "TONER" as Category },
  { icon: "☀", title: "Sun protection", copy: "SPF50+ with zero white cast", category: "SUN CREAM" as Category },
  { icon: "⬡", title: "Beauty tech", copy: "Medicube AGE-R clinical devices", category: "DEVICE" as Category },
];

export const FEATURED_BRANDS = [
  {
    name: "Medicube",
    initials: "MC",
    blurb: "Korean derma-tech, from the AGE-R device line to encapsulated actives.",
  },
  {
    name: "Olivia Glow",
    initials: "OG",
    blurb: "Our own formulations, made for humid, sun-exposed Sri Lankan skin.",
  },
  {
    name: "Beauty of Joseon",
    initials: "BJ",
    blurb: "Hanbang heritage ingredients in modern, beautifully wearable textures.",
  },
  {
    name: "Anua",
    initials: "AN",
    blurb: "Heartleaf-led calming care for reactive and breakout-prone skin.",
  },
  {
    name: "COSRX",
    initials: "CX",
    blurb: "Single-minded formulas built around one hero ingredient at a time.",
  },
  {
    name: "Skin1004",
    initials: "SK",
    blurb: "Pure Madagascar centella, harvested and processed at source.",
  },
];

export function formatLKR(amount: number): string {
  return `LKR ${Math.round(amount).toLocaleString("en-US")}`;
}

export function installmentAmount(amount: number, months = 3): string {
  return formatLKR(amount / months);
}

export function discountPercent(product: BeautyProduct): number | null {
  if (!product.originalPriceLKR) return null;
  return Math.round((1 - product.priceLKR / product.originalPriceLKR) * 100);
}

export function findProduct(id: string): BeautyProduct | undefined {
  return PRODUCTS_CATALOG.find((product) => product.id === id);
}
