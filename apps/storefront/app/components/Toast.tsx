"use client";

import { useStore } from "../lib/store";

export function Toast() {
  const { toast, dismissToast, openCart, isCartOpen } = useStore();
  // Redundant while the bag itself is on screen.
  if (!toast || isCartOpen) return null;

  return (
    <div className="toast glass-dark" role="status" aria-live="polite">
      <span>{toast}</span>
      <button
        onClick={() => {
          dismissToast();
          openCart();
        }}
      >
        View bag
      </button>
    </div>
  );
}
