import { formatLKR, type BeautyProduct, type Category } from "../data/products";
import type { PublicSettings } from "./public-settings";

/**
 * The concierge's script.
 *
 * This is a decision tree, not a language model: every answer is written by us
 * and every product it suggests comes out of the live catalogue. That keeps it
 * accurate about price, stock and delivery, and means it costs nothing to run.
 * Anything it can't answer is handed to a human on WhatsApp rather than guessed.
 */

export interface ChatOption {
  /** Node id to visit, or a `do:` command the widget handles itself. */
  id: string;
  label: string;
}

export interface ChatAnswer {
  /** One bubble per entry, delivered with a short pause between them. */
  bubbles: string[];
  options: ChatOption[];
  /** Products to show as cards under the bubbles. */
  products?: BeautyProduct[];
  /** Shows the reference input instead of the normal composer. */
  ask?: "order-reference";
  link?: { href: string; label: string };
}

export interface ChatContext {
  catalog: BeautyProduct[];
  settings: PublicSettings;
  cartCount: number;
}

/* ==========================================================================
   Concern matching
   ========================================================================== */

interface Concern {
  key: string;
  label: string;
  /** Lower-case; matched against the product's own words. */
  keywords: string[];
  /**
   * Words that mean the product is wrong for this concern even though it may
   * match on other terms — a clarifying, oil-stripping cream is still a cream.
   */
  avoid?: string[];
  categories: Category[];
  intro: string;
}

export const CONCERNS: Concern[] = [
  {
    key: "dry",
    label: "Dry & dehydrated",
    keywords: [
      "hyaluron", "ceramide", "moistur", "hydrat", "barrier", "dry", "nourish",
      "plump", "squalane", "panthenol", "dewy", "rich",
    ],
    avoid: ["clarify", "sebum", "oil control", "acne", "exfoliat", "peel", "blackhead"],
    categories: ["MOISTURIZERS", "SERUM"],
    intro: "Dehydration is usually a barrier problem, not a water problem — these rebuild the barrier rather than just coating the skin.",
  },
  {
    key: "acne",
    label: "Acne & breakouts",
    keywords: [
      "acne", "blemish", "breakout", "pore", "salicylic", "bha", "sebum", "oily",
      "oil control", "centella", "cica", "azelaic", "clarify", "purif", "blackhead",
    ],
    categories: ["TONER", "SERUM", "CLEANSER"],
    intro: "For breakouts I'd keep it simple — one active, one calming step, and nothing that strips the skin.",
  },
  {
    key: "dullness",
    label: "Dark spots & dullness",
    keywords: [
      "brighten", "niacinamide", "vitamin c", "tranexamic", "txa", "dark spot",
      "pigment", "tone", "glow", "radian", "dull", "luminous", "whitening",
    ],
    categories: ["SERUM", "TONER", "FACE MASK"],
    intro: "Brightening is a patience game — six to eight weeks of consistent use beats anything dramatic.",
  },
  {
    key: "ageing",
    label: "Fine lines & firmness",
    keywords: [
      "collagen", "retinol", "peptide", "firm", "wrinkle", "elastic", "lifting",
      "anti-ag", "anti ag", "sagg", "bouncy", "age-r", "booster",
    ],
    categories: ["SERUM", "COLLAGEN", "DEVICE", "MOISTURIZERS"],
    intro: "Firmness responds best to collagen support from the inside and stimulation on the surface.",
  },
  {
    key: "sensitive",
    label: "Redness & sensitivity",
    keywords: [
      "soothe", "calm", "redness", "sensitive", "gentle", "mild", "irritat",
      "azelaic", "panthenol", "centella", "cica", "fragrance-free",
    ],
    avoid: ["retinol", "peel", "exfoliat", "acid ", "scrub", "vitamin c"],
    categories: ["TONER", "MOISTURIZERS", "CLEANSER"],
    intro: "With reactive skin, less is more. Everything here is fragrance-light and built to calm rather than treat.",
  },
  {
    key: "sun",
    label: "Sun protection",
    keywords: ["spf", "sun", "uv", "sunscreen", "pa+", "white cast"],
    categories: ["SUN CREAM"],
    intro: "Sunscreen is the one step that protects every other step you're paying for — and this one sits invisibly under makeup.",
  },
  {
    key: "hair",
    label: "Hair & scalp",
    keywords: ["hair", "scalp", "shampoo", "treatment", "damaged", "frizz", "silk", "keratin"],
    categories: ["HAIR CARE"],
    intro: "Salon-grade Korean hair care — these are the ones our regulars re-order.",
  },
];

function haystack(product: BeautyProduct): string {
  return [
    product.name,
    product.shortName,
    product.brand,
    product.category,
    product.description,
    product.benefits.join(" "),
    product.keyIngredients ?? "",
    (product.concerns ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
}

/**
 * A product has to clear this to be suggested at all. Being in the concern's
 * primary category is worth exactly this much on its own, so anything below it
 * matched only on stray words in a description — which is how a milky toner
 * ends up recommended as sun protection.
 */
const RELEVANCE_FLOOR = 5;

/**
 * Ranks the catalogue against a concern. Words in the product's own name count
 * for more than words buried in the description, anything out of stock is
 * dropped — recommending something we can't ship is worse than saying nothing —
 * and a weak match is dropped rather than padded out to three.
 */
export function matchProducts(catalog: BeautyProduct[], concern: Concern, limit = 3): BeautyProduct[] {
  const ranked = catalog
    .filter((product) => product.stockCount > 0)
    .map((product) => {
      const text = haystack(product);
      const title = `${product.name} ${product.shortName}`.toLowerCase();
      let score = 0;
      for (const word of concern.keywords) {
        if (title.includes(word)) score += 4;
        else if (text.includes(word)) score += 1;
      }
      for (const word of concern.avoid ?? []) {
        if (title.includes(word)) score -= 6;
        else if (text.includes(word)) score -= 2;
      }
      // The first category listed is the one the concern is really about.
      const rank = concern.categories.indexOf(product.category);
      if (rank === 0) score += 5;
      else if (rank > 0) score += 2;
      if (product.bestseller) score += 2;
      if (product.rating && product.rating >= 4.5) score += 1;
      return { product, score };
    })
    .filter((entry) => entry.score >= RELEVANCE_FLOOR)
    .sort((a, b) => b.score - a.score || a.product.priceLKR - b.product.priceLKR);

  /*
   * Spread the answer across brands so one label can't fill it — but Medicube
   * alone is over half the catalogue, so insisting on that would push genuinely
   * good matches out for weak ones. One per brand first, then a second of the
   * same brand only if we're still short.
   */
  const take = (maxPerBrand: number): BeautyProduct[] => {
    const picked: BeautyProduct[] = [];
    const seen = new Map<string, number>();
    for (const { product } of ranked) {
      const used = seen.get(product.brand) ?? 0;
      if (used >= maxPerBrand) continue;
      seen.set(product.brand, used + 1);
      picked.push(product);
      if (picked.length === limit) break;
    }
    return picked;
  };

  const spread = take(1);
  return spread.length === limit ? spread : take(2);
}

/** Free-text search over the catalogue, for when someone names a product. */
export function searchCatalog(catalog: BeautyProduct[], query: string, limit = 3): BeautyProduct[] {
  const words = query.toLowerCase().split(/[^a-z0-9+]+/).filter((word) => word.length > 2);
  if (words.length === 0) return [];
  return catalog
    .map((product) => {
      const title = `${product.name} ${product.brand}`.toLowerCase();
      const text = haystack(product);
      const score = words.reduce(
        (total, word) => total + (title.includes(word) ? 3 : text.includes(word) ? 1 : 0),
        0,
      );
      return { product, score };
    })
    .filter((entry) => entry.score >= words.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.product);
}

/* ==========================================================================
   Intent detection for typed messages
   ========================================================================== */

const INTENTS: { node: string; keywords: string[] }[] = [
  { node: "delivery", keywords: ["deliver", "shipping", "ship", "courier", "how long", "post", "cod", "cash on"] },
  { node: "pay", keywords: ["pay", "payment", "instal", "koko", "mintpay", "payzy", "card", "bank"] },
  { node: "authentic", keywords: ["authentic", "genuine", "original", "fake", "real", "expiry", "expire"] },
  { node: "order", keywords: ["order", "track", "parcel", "where is", "delivered yet", "status"] },
  { node: "returns", keywords: ["return", "refund", "exchange", "damaged", "wrong item", "broken"] },
  { node: "human", keywords: ["human", "agent", "someone", "call me", "speak to", "talk to"] },
  { node: "root", keywords: ["hi", "hello", "hey", "ayubowan", "menu", "help"] },
];

export interface Understood {
  node?: string;
  concern?: Concern;
  products?: BeautyProduct[];
}

/**
 * Works out what a typed message is about. Concerns beat intents when both
 * match, because "my skin is oily and I want delivery info" is really a skin
 * question with a delivery aside.
 */
export function understand(text: string, catalog: BeautyProduct[]): Understood {
  const lower = text.toLowerCase().trim();
  if (!lower) return {};

  if (/\bog-?\s?\d{3,}\b/i.test(lower)) return { node: "order" };

  const concern = CONCERNS.map((entry) => ({
    entry,
    hits: entry.keywords.filter((word) => lower.includes(word)).length +
      (lower.includes(entry.label.split(" ")[0].toLowerCase()) ? 1 : 0),
  }))
    .filter((match) => match.hits > 0)
    .sort((a, b) => b.hits - a.hits)[0];
  if (concern) return { concern: concern.entry };

  const intent = INTENTS.find((entry) => entry.keywords.some((word) => lower.includes(word)));
  if (intent) return { node: intent.node };

  const products = searchCatalog(catalog, lower);
  if (products.length) return { products };

  return {};
}

/* ==========================================================================
   The tree
   ========================================================================== */

const MAIN_MENU: ChatOption[] = [
  { id: "concern", label: "Help me pick a routine" },
  { id: "delivery", label: "Delivery & payment" },
  { id: "order", label: "Track my order" },
  { id: "authentic", label: "Are these authentic?" },
  { id: "human", label: "Talk to a person" },
];

const BACK: ChatOption[] = [
  { id: "concern", label: "Help me pick a routine" },
  { id: "human", label: "Talk to a person" },
  { id: "root", label: "Something else" },
];

export function greeting(context: ChatContext): ChatAnswer {
  return {
    bubbles: [
      `Hi 👋 I'm the ${context.settings.storeName} concierge.`,
      "I can build you a routine, check delivery, or put you straight through to the team on WhatsApp. What do you need?",
    ],
    options: context.cartCount > 0
      ? [{ id: "do:bag", label: `Send my bag (${context.cartCount}) to WhatsApp` }, ...MAIN_MENU]
      : MAIN_MENU,
  };
}

export function answer(nodeId: string, context: ChatContext): ChatAnswer {
  const { settings, catalog } = context;

  if (nodeId.startsWith("concern:")) {
    const concern = CONCERNS.find((entry) => entry.key === nodeId.slice(8));
    if (concern) return recommend(concern, context);
  }

  switch (nodeId) {
    case "root":
      return {
        bubbles: ["Of course — what would you like to look at?"],
        options: MAIN_MENU,
      };

    case "concern":
      return {
        bubbles: ["Tell me what your skin's dealing with and I'll pull a few things off the shelf."],
        options: CONCERNS.map((entry) => ({ id: `concern:${entry.key}`, label: entry.label })),
      };

    case "delivery":
      return {
        bubbles: [
          `We deliver islandwide. Orders over ${formatLKR(settings.freeShippingThresholdLKR)} ship free — otherwise it's a flat ${formatLKR(settings.flatShippingLKR)}.`,
          "Colombo usually lands in 1–2 working days, outstation 2–4. Cash on delivery is available everywhere.",
        ],
        options: [
          { id: "pay", label: "Payment options" },
          { id: "order", label: "Track my order" },
          ...BACK.slice(1),
        ],
      };

    case "pay":
      return {
        bubbles: [
          "You can pay cash on delivery, by bank transfer, or split it into 3 interest-free instalments with Mintpay, Koko or Payzy.",
          `Instalments work out to a third of the total each month over ${settings.installmentMonths} months, with nothing extra added.`,
        ],
        options: BACK,
      };

    case "authentic":
      return {
        bubbles: [
          "Every product is sourced direct from the Korean distributor — no grey market, no refills.",
          "Boxes arrive sealed with the batch code and manufacture date intact, and you're welcome to check them at the door before paying.",
        ],
        options: BACK,
      };

    case "order":
      return {
        bubbles: [
          "Happy to check. What's your order reference? It looks like OG-1024 and it's in your confirmation message.",
        ],
        options: [{ id: "human", label: "I don't have it" }],
        ask: "order-reference",
      };

    case "returns":
      return {
        bubbles: [
          "If something arrives damaged or isn't what you ordered, message us within 48 hours with a photo and we'll replace it — no argument.",
          "Opened skincare can't be returned for hygiene reasons, which is why we'd rather help you pick right the first time.",
        ],
        options: BACK,
      };

    case "human":
      return {
        bubbles: [
          "I'll hand you over — the team answers within a few minutes during the day.",
        ],
        options: [{ id: "do:whatsapp", label: "Open WhatsApp" }, { id: "root", label: "Back to the menu" }],
      };

    case "unknown":
      return {
        bubbles: [
          "That one's beyond me, but the team will know.",
          "Want me to pass it over on WhatsApp?",
        ],
        options: [{ id: "do:whatsapp", label: "Yes, ask the team" }, ...BACK],
      };

    default:
      return {
        bubbles: ["Let's start again — what can I help with?"],
        options: MAIN_MENU,
      };
  }
}

function recommend(concern: Concern, context: ChatContext): ChatAnswer {
  const products = matchProducts(context.catalog, concern);
  if (products.length === 0) {
    return {
      bubbles: [
        `We're out of stock on our ${concern.label.toLowerCase()} picks right now.`,
        "The team can tell you when the next shipment lands.",
      ],
      options: [{ id: "do:whatsapp", label: "Ask about restock" }, ...BACK],
    };
  }
  return {
    bubbles: [concern.intro],
    products,
    options: [
      { id: "concern", label: "Different concern" },
      { id: "do:whatsapp", label: "Ask about these" },
      { id: "root", label: "Something else" },
    ],
  };
}

/** Confirms a reference and, if it looks real, links to the tracking page. */
export function orderLookup(reference: string): ChatAnswer {
  const match = reference.toUpperCase().match(/OG-?\s?(\d{3,})/);
  if (!match) {
    return {
      bubbles: [
        "That doesn't look like one of our references — they start with OG and have four digits, like OG-1024.",
        "If you can't find it, the team can look you up by phone number.",
      ],
      options: [{ id: "do:whatsapp", label: "Look me up by phone" }, { id: "order", label: "Try again" }],
    };
  }
  const clean = `OG-${match[1]}`;
  return {
    bubbles: [`Here's everything we have on ${clean} — status, items and delivery address.`],
    link: { href: `/order/${clean}`, label: `Open ${clean}` },
    options: BACK,
  };
}

/** The transcript summary handed to WhatsApp so nobody repeats themselves. */
export function handoffMessage(topics: string[], cart: { name: string; quantity: number }[]): string {
  const lines = ["Hi Olivia Glow, I was chatting on your site and need a hand."];
  if (topics.length) lines.push(`I was asking about: ${topics.slice(-3).join(", ")}.`);
  if (cart.length) {
    lines.push("", "In my bag:");
    for (const line of cart) lines.push(`• ${line.quantity} × ${line.name}`);
  }
  return lines.join("\n");
}
