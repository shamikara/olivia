import type { BeautyProduct, Category } from "../data/products";

const CATEGORIES: Category[] = [
  "SERUM",
  "MOISTURIZERS",
  "TONER",
  "CLEANSER",
  "SUN CREAM",
  "FACE MASK",
  "COLLAGEN",
  "HAIR CARE",
  "DEVICE",
];

type Result = { product: BeautyProduct } | { error: string };

const text = (value: unknown): string => (typeof value === "string" ? value.trim() : "");
const optionalText = (value: unknown): string | undefined => text(value) || undefined;

function number(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(text).filter(Boolean);
  if (typeof value === "string") {
    return value
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  }
  return [];
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

/** Validates and coerces admin form input into a storable product. */
export function normaliseProduct(input: unknown): Result {
  if (typeof input !== "object" || input === null) return { error: "Expected a product object" };
  const raw = input as Record<string, unknown>;

  const name = text(raw.name);
  if (!name) return { error: "Name is required" };

  const brand = text(raw.brand);
  if (!brand) return { error: "Brand is required" };

  const price = number(raw.priceLKR);
  if (price === undefined || price < 0) return { error: "Price must be a positive number" };

  const category = text(raw.category) as Category;
  if (!CATEGORIES.includes(category)) {
    return { error: `Category must be one of: ${CATEGORIES.join(", ")}` };
  }

  const image = text(raw.image);
  if (!image) return { error: "A main image is required" };

  const originalPrice = number(raw.originalPriceLKR);
  const stock = number(raw.stockCount);
  const rating = number(raw.rating);
  const reviews = number(raw.reviewsCount);

  const product: BeautyProduct = {
    id: text(raw.id) || `p-${slugify(name)}`,
    name,
    shortName: text(raw.shortName) || name.slice(0, 42),
    brand,
    category,
    size: optionalText(raw.size),
    priceLKR: Math.round(price),
    originalPriceLKR: originalPrice && originalPrice > price ? Math.round(originalPrice) : undefined,
    rating: rating !== undefined && rating > 0 ? Math.min(5, rating) : undefined,
    reviewsCount: reviews !== undefined && reviews > 0 ? Math.round(reviews) : undefined,
    image,
    secondaryImage: optionalText(raw.secondaryImage),
    description: text(raw.description),
    benefits: list(raw.benefits),
    concerns: list(raw.concerns).length ? list(raw.concerns) : undefined,
    howToUse: optionalText(raw.howToUse),
    keyIngredients: optionalText(raw.keyIngredients),
    stockCount: stock === undefined ? 0 : Math.max(0, Math.round(stock)),
    tag: optionalText(raw.tag),
  };

  return { product };
}
