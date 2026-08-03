"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";
import { ProductsManager } from "./ProductsManager";
import { OrdersManager } from "./OrdersManager";
import { CustomersManager } from "./CustomersManager";
import { Overview } from "./Overview";
import { InventoryManager } from "./InventoryManager";
import { MarketingManager } from "./MarketingManager";
import { SettingsManager } from "./SettingsManager";
import { ReportsPanel } from "./ReportsPanel";

/*
 * Every module in the sidebar is backed by real data. Modules from the original
 * scaffold that had nothing behind them (Collections, Content, Loyalty, AI
 * tools, Audit logs, System health, Payments, Shipping) were removed rather
 * than left as dead links — Payments and Shipping now live under Settings.
 */
const BUILT = new Set(["Overview", "Orders", "Products", "Inventory", "Customers", "Marketing", "Reports", "Settings"]);

const nav = ["Overview", "Orders", "Products", "Inventory", "Customers", "Marketing", "Reports", "Settings"];

export default function Admin() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pending, setPending] = useState(0);

  // Badge the Orders tab with the count still awaiting confirmation.
  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setPending(data.pendingOrders))
      .catch(() => {});
  }, [active]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } catch {
      setIsLoggingOut(false);
    }
  };

  return <main className="admin-shell">
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><span className="brand-symbol"/>OLIVIA <em>GLOW</em></a><p className="admin-label">STORE MANAGEMENT</p><nav className="admin-nav">{nav.map(item=><button key={item} className={active===item?"active":""} onClick={()=>setActive(item)}>{item}{item === "Orders" && pending > 0 && <span>{pending}</span>}{!BUILT.has(item) && <span className="soon">soon</span>}</button>)}</nav><div className="admin-user"><div>OC</div><p>Olivia Chen<small>Super admin</small></p><button onClick={handleLogout} className="admin-logout-btn" title="Sign Out" disabled={isLoggingOut}>{isLoggingOut ? "..." : "⎋"}</button></div></aside>
    <section className="admin-content"><header className="admin-header"><div><p className="eyebrow">{new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}</p><h1>{active === "Overview" ? <>Store <i>overview.</i></> : <>{active}<i>.</i></>}</h1></div><div className="admin-actions"><button onClick={handleLogout} className="signout-header-btn" disabled={isLoggingOut}>{isLoggingOut ? "Signing out..." : "Sign out ⎋"}</button><a href="/">View store ↗</a></div></header>
      {active === "Overview" ? <Overview onNavigate={setActive}/>
        : active === "Products" ? <ProductsManager/>
        : active === "Inventory" ? <InventoryManager/>
        : active === "Orders" ? <OrdersManager/>
        : active === "Customers" ? <CustomersManager/>
        : active === "Marketing" ? <MarketingManager/>
        : active === "Reports" ? <ReportsPanel/>
        : <SettingsManager/>}
    </section>
  </main>;
}

