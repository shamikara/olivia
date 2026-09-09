import type { Metadata } from "next";
import { StoreShell } from "../components/StoreShell";
import { CheckoutForm } from "./CheckoutForm";
import { paymentOptions } from "../lib/payments";
import { getSettings } from "../lib/settings-store";
import { DISTRICTS } from "../lib/address";
import { CUSTOMER_COOKIE, readCustomerToken } from "../lib/customer-auth";
import { findById } from "../lib/customer-store";
import { cookies } from "next/headers";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [options, settings] = await Promise.all([paymentOptions(), getSettings()]);

  // Saved addresses save a signed-in shopper retyping everything.
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  const claims = await readCustomerToken(token);
  const customer = claims ? await findById(claims.sub) : undefined;

  return (
    <StoreShell>
      <header className="page-head has-aura">
        <div className="aura aura-blush" style={{ width: 360, height: 360, top: -150, left: -110 }} />
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <p className="eyebrow">Checkout</p>
          <h1>
            Almost <span className="accent">yours.</span>
          </h1>
        </div>
      </header>

      <CheckoutForm
        options={options}
        districts={DISTRICTS}
        installmentMonths={settings.installmentMonths}
        freeShippingThresholdLKR={settings.freeShippingThresholdLKR}
        flatShippingLKR={settings.flatShippingLKR}
        customer={
          customer
            ? {
                name: customer.name,
                email: customer.email,
                phone: customer.phone ?? "",
                addresses: customer.addresses,
              }
            : null
        }
      />
    </StoreShell>
  );
}
