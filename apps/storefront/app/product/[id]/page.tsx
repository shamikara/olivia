import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct } from "../../lib/product-store";
import { absolute, metaDescription } from "../../lib/seo";
import { ProductDetail } from "./ProductDetail";

/**
 * Server wrapper around the (client) product page.
 *
 * It exists for metadata. A client component cannot export generateMetadata,
 * so every product previously inherited the site-wide title — 47 pages
 * indexed under one name, which reads as near-duplicate content and means a
 * search for a specific product matches nothing.
 *
 * The interactive page itself is unchanged; it still reads the catalogue from
 * the store.
 */

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) return { title: "Product not found" };

  const url = absolute(`/product/${product.id}`);
  const title = `${product.name} — ${product.brand}`;
  const description = metaDescription(
    product.description || `${product.name} by ${product.brand}, available in Sri Lanka with islandwide delivery.`,
  );
  const image = product.image.startsWith("http") ? product.image : absolute(product.image);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title,
      description,
      images: [{ url: image, alt: product.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProductPage({ params }: Params) {
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  /*
   * Product structured data. This is what produces the price-and-availability
   * line under a search result, and it is the highest-leverage markup a shop
   * can publish. Fields are only included when real: an invented rating is
   * worse than none, and Google penalises markup that disagrees with the page.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: [product.image.startsWith("http") ? product.image : absolute(product.image)],
    description: product.description,
    sku: product.id,
    brand: { "@type": "Brand", name: product.brand },
    ...(product.rating && product.reviewsCount
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewsCount,
          },
        }
      : {}),
    offers: {
      "@type": "Offer",
      url: absolute(`/product/${product.id}`),
      priceCurrency: "LKR",
      price: product.priceLKR,
      availability:
        product.stockCount > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductDetail />
    </>
  );
}
