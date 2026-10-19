"use client";

import { useState, useTransition, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MIN_PASSWORD_LENGTH } from "../../lib/password-policy";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  // A token in the query string means the admin followed a reset link, so the
  // card becomes a "choose a new password" form instead of a sign-in form.
  const resetToken = searchParams.get("reset");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const requestReset = () => {
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your work email first, then choose Forgot password.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/password/reset", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        // Deliberately the same message whether or not the account exists.
        setNotice(data.message ?? "If that address has an admin account, a reset link is on its way.");
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  };

  const submitNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/password/reset", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Could not set that password");
          return;
        }
        setNotice("Password updated. Sign in with your new password.");
        setPassword("");
        router.replace("/admin/login");
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Authentication failed");
          return;
        }

        router.push(from);
        router.refresh();
      } catch {
        setError("Network error. Please check your connection and try again.");
      }
    });
  };

  return (
    <div className="admin-login-shell">
      <div className="admin-login-card">
        <header className="login-header">
          <a className="admin-brand" href="/">
            <img src="/images/olivia-glow-logo.jpeg" alt="Olivia Glow Logo" style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid #d4af37" }} />
            OLIVIA <em>GLOW</em>
          </a>
          <p className="admin-label">STORE MANAGEMENT PORTAL</p>
          <h1>Staff Sign In</h1>
          <p className="login-subtext">
            Enter your admin credentials to manage products, orders, inventory, and storefront settings.
          </p>
        </header>

        {error && (
          <div className="login-error-alert" role="alert">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {notice && (
          <div className="login-notice-alert" role="status">
            <span>{notice}</span>
          </div>
        )}

        {resetToken ? (
          <form onSubmit={submitNewPassword} className="login-form">
            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={MIN_PASSWORD_LENGTH}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                disabled={isPending}
              />
            </div>
            <p className="login-subtext">At least {MIN_PASSWORD_LENGTH} characters. The link works once.</p>
            <button type="submit" className="login-submit-btn" disabled={isPending}>
              {isPending ? <span className="btn-spinner">Saving...</span> : "Set new password"}
            </button>
          </form>
        ) : (
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Work Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@oliviaglow.lk"
              disabled={isPending}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isPending}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={isPending}>
            {isPending ? (
              <span className="btn-spinner">Signing in...</span>
            ) : (
              "Sign In to Operations Portal →"
            )}
          </button>

          <button type="button" className="login-forgot-btn" onClick={requestReset} disabled={isPending}>
            Forgot password?
          </button>
        </form>
        )}

        <footer className="login-footer">
          <a href="/">← Return to Storefront</a>
          <span>Olivia Glow Platform • Secured via JWT</span>
        </footer>
      </div>

      <style jsx>{`
        .admin-login-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 50% 20%, #171f2b 0%, #0a0d14 100%);
          color: #f1f5f9;
          font-family: inherit;
          padding: 24px;
        }

        .admin-login-card {
          width: 100%;
          max-width: 440px;
          background: rgba(18, 24, 38, 0.95);
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 16px;
          padding: 40px 36px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.05);
          backdrop-filter: blur(12px);
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .admin-brand {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: #e2e8f0;
          font-size: 1.15rem;
          letter-spacing: 0.15em;
          text-decoration: none;
          font-weight: 600;
        }

        .brand-symbol {
          width: 10px;
          height: 10px;
          background: #d4af37;
          border-radius: 50%;
          display: inline-block;
        }

        .admin-brand em {
          color: #d4af37;
          font-style: normal;
        }

        .admin-label {
          font-size: 0.7rem;
          letter-spacing: 0.2em;
          color: #94a3b8;
          margin-top: 6px;
          font-weight: 600;
        }

        h1 {
          font-size: 1.6rem;
          font-weight: 500;
          margin-top: 16px;
          margin-bottom: 8px;
          color: #ffffff;
        }

        .login-subtext {
          font-size: 0.85rem;
          color: #94a3b8;
          line-height: 1.5;
        }

        .login-notice-alert {
          background: rgba(47, 107, 83, 0.15);
          border: 1px solid rgba(47, 107, 83, 0.45);
          color: #bbf7d0;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          margin-bottom: 24px;
        }

        .login-forgot-btn {
          display: block;
          width: 100%;
          margin-top: 14px;
          background: none;
          border: none;
          color: #94a3b8;
          font-size: 0.8rem;
          cursor: pointer;
          text-decoration: underline;
        }

        .login-error-alert {
          background: rgba(225, 29, 72, 0.15);
          border: 1px solid rgba(225, 29, 72, 0.4);
          color: #fecdd3;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 24px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
          text-align: left;
        }

        label {
          font-size: 0.75rem;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #cbd5e1;
          font-weight: 600;
        }

        input {
          background: rgba(10, 14, 23, 0.8);
          border: 1px solid rgba(148, 163, 184, 0.2);
          border-radius: 8px;
          padding: 12px 14px;
          color: #ffffff;
          font-size: 0.95rem;
          outline: none;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        input:focus {
          border-color: #d4af37;
          box-shadow: 0 0 0 3px rgba(212, 175, 55, 0.15);
        }



        .login-submit-btn {
          margin-top: 8px;
          background: linear-gradient(135deg, #d4af37 0%, #b8860b 100%);
          color: #0b0f17;
          font-weight: 600;
          font-size: 0.9rem;
          padding: 14px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          transition: transform 0.15s ease, opacity 0.15s ease, box-shadow 0.15s ease;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.25);
        }

        .login-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.35);
        }

        .login-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-footer {
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.75rem;
          color: #64748b;
        }

        .login-footer a {
          color: #94a3b8;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        .login-footer a:hover {
          color: #d4af37;
        }
      `}</style>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center", color: "#fff" }}>Loading sign in...</div>}>
      <AdminLoginForm />
    </Suspense>
  );
}
