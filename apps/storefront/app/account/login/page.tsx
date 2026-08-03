import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { StoreShell } from "../../components/StoreShell";
import { AccountForms } from "../AccountForms";
import { currentCustomer } from "../../lib/customer-auth";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage() {
  if (await currentCustomer()) redirect("/account");

  return (
    <StoreShell>
      <section className="auth-page">
        <div className="container auth-inner">
          <p className="eyebrow">Your account</p>
          <h1>
            Welcome <span className="accent">back.</span>
          </h1>
          <p className="lede muted">
            Sign in to see your orders and check out faster with a saved address.
          </p>
          <Suspense fallback={<p className="muted">Loading…</p>}>
            <AccountForms mode="login" />
          </Suspense>
        </div>
      </section>
    </StoreShell>
  );
}
