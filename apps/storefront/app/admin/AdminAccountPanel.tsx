"use client";

import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "../lib/password-policy";

/**
 * The signed-in administrator's own account.
 *
 * Changing a password requires the current one even though the session is
 * already valid — a borrowed unlocked browser should not be enough to lock
 * the real owner out.
 */
export function AdminAccountPanel() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const submit = async () => {
    setFlash(null);
    if (next !== confirm) {
      setFlash({ kind: "bad", text: "The two new passwords don't match" });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlash({ kind: "ok", text: "Password changed." });
        setCurrent("");
        setNext("");
        setConfirm("");
      } else {
        setFlash({ kind: "bad", text: data.error ?? "Could not change the password" });
      }
    } catch {
      setFlash({ kind: "bad", text: "Network error" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="admin-panel">
      <h3>Your password</h3>
      {flash && <p className={flash.kind === "ok" ? "admin-flash" : "admin-warn"}>{flash.text}</p>}
      <label>
        Current password
        <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} />
      </label>
      <label>
        New password
        <input type="password" value={next} onChange={(e) => setNext(e.target.value)} />
      </label>
      <label>
        Confirm new password
        <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </label>
      <p className="admin-hint">At least {MIN_PASSWORD_LENGTH} characters.</p>
      <button
        className="btn"
        onClick={() => void submit()}
        disabled={busy || !current || next.length < MIN_PASSWORD_LENGTH}
      >
        {busy ? "Saving…" : "Change password"}
      </button>
    </article>
  );
}
