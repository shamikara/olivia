import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { StoreShell } from "../components/StoreShell";
import { currentCustomer } from "../lib/customer-auth";
import { findById, toPublic } from "../lib/customer-store";
import { ordersForCustomer } from "../lib/order-store";
import { AccountDashboard } from "./AccountDashboard";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const claims = await currentCustomer();
  if (!claims) redirect("/account/login?next=/account");

  const customer = await findById(claims.sub);
  if (!customer) redirect("/account/login");

  const orders = await ordersForCustomer(customer.id);

  return (
    <StoreShell>
      <AccountDashboard customer={toPublic(customer)} orders={orders} />
    </StoreShell>
  );
}
