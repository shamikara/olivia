import type { Metadata } from "next";
import { absolute } from "../lib/seo";
import { CompareTable } from "./CompareTable";

/**
 * Server wrapper for metadata. The table is a client component and cannot
 * export it itself.
 *
 * Deliberately not indexed: the page renders whatever this one visitor put in
 * their tray, so it is a different page for everyone and empty for a crawler.
 * `follow` stays on so the links out to the products it lists still count.
 */
export const metadata: Metadata = {
  title: "Compare products",
  description: "Compare skincare side by side — price, ingredients, targets and benefits.",
  alternates: { canonical: absolute("/compare") },
  robots: { index: false, follow: true },
};

export default function ComparePage() {
  return <CompareTable />;
}
