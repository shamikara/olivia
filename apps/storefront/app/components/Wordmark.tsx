import Link from "next/link";
import { SITE } from "../lib/site";

export function Wordmark({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <Link href="/" className="wordmark" aria-label={`${SITE.name} home`}>
      <span className="wordmark-mark">
        <img src={SITE.logo} alt="" />
      </span>
      <span className="wordmark-text">
        <b>
          OLIVIA <em>GLOW</em>
        </b>
        {showTagline && <small>{SITE.tagline}</small>}
      </span>
    </Link>
  );
}
