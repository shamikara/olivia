"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { COMPARE_LIMIT, useStore } from "../lib/store";
import { CloseIcon } from "./Icons";

/**
 * The shelf of products picked for comparison, docked above the mobile tab bar.
 *
 * It only appears once something is in it, and never on the comparison page
 * itself — there the table is the tray. Empty slots are drawn up to the limit
 * so it reads as "room for two more" rather than as a finished selection.
 */
export function CompareTray() {
  const { catalog, compare, toggleCompare, clearCompare } = useStore();
  const pathname = usePathname();

  const onComparePage = pathname === "/compare";
  const visible = compare.length > 0 && !onComparePage;

  /*
   * The chat launcher and the page's own bottom padding both sit where the
   * tray lands, and neither knows about it. A class on <body> lets their rules
   * move out of the way without this component reaching into them directly.
   */
  useEffect(() => {
    document.body.classList.toggle("has-compare-tray", visible);
    return () => document.body.classList.remove("has-compare-tray");
  }, [visible]);

  if (!visible) return null;

  const picked = compare
    .map((id) => catalog.find((product) => product.id === id))
    .filter((product): product is NonNullable<typeof product> => product !== undefined);

  const emptySlots = Math.max(0, COMPARE_LIMIT - picked.length);

  return (
    <div className="compare-tray glass-dark" role="region" aria-label="Products to compare">
      <div className="compare-tray-inner">
        <div className="compare-tray-items">
          {picked.map((product) => (
            <div className="compare-slot" key={product.id}>
              <img src={product.image} alt="" loading="lazy" />
              <button
                onClick={() => toggleCompare(product.id)}
                aria-label={`Remove ${product.shortName} from compare`}
              >
                <CloseIcon size={13} />
              </button>
            </div>
          ))}

          {Array.from({ length: emptySlots }, (_, index) => (
            <div className="compare-slot is-empty" key={`empty-${index}`} aria-hidden="true" />
          ))}
        </div>

        <div className="compare-tray-actions">
          <button className="compare-clear" onClick={clearCompare}>
            Clear
          </button>
          {/*
            * One product has nothing to sit beside, so the button says what is
            * missing rather than going to a table with a single column.
            */}
          {picked.length < 2 ? (
            <span className="compare-hint">Pick one more to compare</span>
          ) : (
            <Link className="btn btn-gold btn-sm" href="/compare">
              Compare {picked.length}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
