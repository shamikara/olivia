"use client";

import { useState, type FormEvent } from "react";

/**
 * No mailing-list backend yet, so this confirms locally rather than posting the
 * address somewhere it would be silently dropped.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [signedUp, setSignedUp] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (email.trim()) setSignedUp(true);
  };

  if (signedUp) {
    return (
      <div>
        <p style={{ fontFamily: "var(--serif)", fontSize: "1.3rem", marginBottom: 8 }}>
          Welcome to the glow list.
        </p>
        <p className="muted" style={{ fontSize: "0.85rem" }}>
          Use code <strong>GLOW10</strong> at checkout for 10% off your first order.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit}>
      <input
        type="email"
        name="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="your@email.com"
        aria-label="Email address"
        required
      />
      <button className="btn" type="submit">
        Get my code
      </button>
      <small>Restock alerts and routine guides. No spam, unsubscribe any time.</small>
    </form>
  );
}
