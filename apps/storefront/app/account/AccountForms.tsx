"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type Mode = "login" | "register";

export function AccountForms({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [fields, setFields] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof fields, value: string) =>
    setFields((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={submit}>
      {error && <p className="auth-error">{error}</p>}

      {mode === "register" && (
        <label>
          Full name
          <input value={fields.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" required />
        </label>
      )}

      <label>
        Email
        <input
          type="email"
          value={fields.email}
          onChange={(e) => set("email", e.target.value)}
          autoComplete="email"
          required
        />
      </label>

      {mode === "register" && (
        <label>
          Phone <span className="auth-optional">for delivery updates</span>
          <input
            type="tel"
            value={fields.phone}
            onChange={(e) => set("phone", e.target.value)}
            autoComplete="tel"
            placeholder="07X XXX XXXX"
          />
        </label>
      )}

      <label>
        Password
        <input
          type="password"
          value={fields.password}
          onChange={(e) => set("password", e.target.value)}
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          minLength={mode === "register" ? 8 : undefined}
          required
        />
        {mode === "register" && <span className="auth-hint">At least 8 characters.</span>}
      </label>

      <button className="btn btn-block" type="submit" disabled={busy}>
        {busy ? "Just a moment…" : mode === "register" ? "Create account" : "Sign in"}
      </button>

      <p className="auth-swap">
        {mode === "register" ? (
          <>
            Already have an account? <Link href="/account/login">Sign in</Link>
          </>
        ) : (
          <>
            New here? <Link href="/account/register">Create an account</Link>
          </>
        )}
      </p>
    </form>
  );
}
