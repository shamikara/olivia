/**
 * Canonical origin for metadata.
 *
 * Unlike siteOrigin(), this has no request to read, because generateMetadata
 * and sitemap/robots run without one. It must therefore be configured: a
 * wrong value here puts the wrong canonical URL in front of Google, which is
 * worse than having none.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.oliviaglow.lk").replace(/\/+$/, "");

export const absolute = (path = ""): string => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** Trimmed to roughly what a search result will actually show. */
export function metaDescription(text: string, limit = 155): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
