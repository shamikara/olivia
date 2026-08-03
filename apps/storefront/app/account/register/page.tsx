import { Suspense } from "react";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { StoreShell } from "../../components/StoreShell";
import { AccountForms } from "../AccountForms";
import { currentCustomer } from "../../lib/customer-auth";

export const metadata: Metadata = { title: "Create an account" };

export default async function RegisterPage() {
  if (await currentCustomer()) redirect("/account");

  return (
    <StoreShell>
      <section className="auth-page">
        <div className="container auth-inner">
          <p className="eyebrow">Join Olivia Glow</p>
          <h1>
            Create your <span className="accent">account.</span>
          </h1>
          <p className="lede muted">
            Save your delivery address, keep your order history in one place, and reorder in a tap.
          </p>
          <Suspense fallback={<p className="muted">Loading…</p>}>
            <AccountForms mode="register" />
          </Suspense>
        </div>
      </section>
    </StoreShell>
  );
}
