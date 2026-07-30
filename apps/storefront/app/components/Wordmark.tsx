import Link from "next/link";
import { SITE } from "../lib/site";

/**
 * The logo file is a full lockup — monogram, wordmark and tagline. At mobile
 * header size the wordmark and tagline become unreadable, so the art is drawn
 * as a background and the narrow viewport crops to the monogram alone.
 */
export function Wordmark({ variant = "header" }: { variant?: "header" | "footer" | "drawer" }) {
  return (
    <Link href="/" className={`wordmark wordmark-${variant}`} aria-label={`${SITE.name} home`}>
      <span className="wordmark-art" aria-hidden="true" />
    </Link>
  );
}
