"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import "./admin.css";

const products = [
  ["Morning Dew Serum", "OG-SER-001", "Olivia Glow", "$48.00", "128", "Active"],
  ["Cloud Milk Cleanser", "OG-CLN-002", "Olivia Glow", "$32.00", "7", "Low stock"],
  ["Velvet Barrier Cream", "OG-MOI-003", "Olivia Glow", "$42.00", "62", "Active"],
  ["Golden Hour Oil", "OG-OIL-004", "Olivia Glow", "$54.00", "0", "Out of stock"],
];
const orders = [["#OG-1048", "Maya Rodriguez", "$126.00", "Paid", "Preparing"],["#OG-1047", "Isabel Tan", "$48.00", "Paid", "Shipped"],["#OG-1046", "Chloe Morgan", "$86.00", "Paid", "Delivered"],["#OG-1045", "Sophia Lee", "$54.00", "Pending", "Awaiting payment"]];
const nav = ["Overview", "Orders", "Products", "Categories", "Brands", "Collections", "Customers", "Inventory", "Marketing", "Reviews", "Content", "Reports", "Payments", "Shipping", "Loyalty", "AI tools", "Users & roles", "Settings", "Audit logs", "System health"];

export default function Admin() {
  const router = useRouter();
  const [active, setActive] = useState("Overview");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const shownProducts = useMemo(()=>products.filter(p=>p.join(" ").toLowerCase().includes(query.toLowerCase())),[query]);
  const isProduct = active === "Products";

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
    <aside className="admin-sidebar"><a className="admin-brand" href="/"><span className="brand-symbol"/>OLIVIA <em>GLOW</em></a><p className="admin-label">STORE MANAGEMENT</p><nav className="admin-nav">{nav.map(item=><button key={item} className={active===item?"active":""} onClick={()=>setActive(item)}>{item}{item === "Orders" && <span>8</span>}{item === "Reviews" && <span>3</span>}</button>)}</nav><div className="admin-user"><div>OC</div><p>Olivia Chen<small>Super admin</small></p><button onClick={handleLogout} className="admin-logout-btn" title="Sign Out" disabled={isLoggingOut}>{isLoggingOut ? "..." : "⎋"}</button></div></aside>
    <section className="admin-content"><header className="admin-header"><div><p className="eyebrow">TUESDAY, JULY 28</p><h1>{active === "Overview" ? <>Good morning, <i>Olivia.</i></> : <>{active}<i>.</i></>}</h1></div><div className="admin-actions"><button aria-label="Notifications">♢</button><button onClick={handleLogout} className="signout-header-btn" disabled={isLoggingOut}>{isLoggingOut ? "Signing out..." : "Sign out ⎋"}</button><a href="/">View store ↗</a></div></header>
      {isProduct ? <ProductManager query={query} setQuery={setQuery} products={shownProducts} selected={selected} setSelected={setSelected}/> : active === "Overview" ? <Overview/> : <ModulePanel title={active}/>} 
    </section>
  </main>;
}


function Overview() { const kpis = [["TOTAL REVENUE","$184,920","↗ 18.2%"],["TODAY'S REVENUE","$4,280","↗ 12.4%"],["MONTHLY REVENUE","$48,294","↗ 8.6%"],["ORDERS TODAY","84","↗ 9.2%"],["PENDING ORDERS","8","Action needed"],["COMPLETED ORDERS","1,248","↗ 14.0%"],["CUSTOMERS","4,872","↗ 16.3%"],["PRODUCTS","284","12 drafts"],["OUT OF STOCK","1","Action needed"],["LOW STOCK","3","Restock soon"],["AVERAGE ORDER","$45.21","↗ 5.8%"],["CONVERSION RATE","3.8%","↗ 0.4%"]]; return <><section className="admin-stats admin-stats-full">{kpis.map(([label,value,delta])=><article key={label}><p>{label}</p><h2>{value}<span className={delta.includes("Action")||delta.includes("Restock")?"alert":""}>{delta}</span></h2><small>Compared with previous period</small></article>)}</section><section className="admin-grid"><article className="sales-card"><div className="admin-card-title"><div><p className="eyebrow">REVENUE OVER TIME</p><h2>$48,294 <span>↗ 18.2%</span></h2></div><button>Last 30 days⌄</button></div><div className="chart">{[36,57,42,70,58,81,65,93,74,88,67,100].map((height,i)=><i key={i} style={{height:`${height}%`}}/>)}</div><div className="chart-labels"><span>JUL 1</span><span>JUL 10</span><span>JUL 20</span><span>TODAY</span></div></article><article className="stock-card"><p className="eyebrow">INVENTORY WATCH</p><h2>Low stock</h2><div><span>Cloud Milk Cleanser</span><b>7 left</b></div><div><span>Petal Soft Mist</span><b>12 left</b></div><div><span>Golden Hour Oil</span><b>Out of stock</b></div><a href="#">Manage inventory →</a></article></section><section className="orders-card"><div className="admin-card-title"><div><p className="eyebrow">ORDERS</p><h2>Recent orders</h2></div><a href="#">View all orders →</a></div><OrderTable/></section><section className="activity-card"><div><p className="eyebrow">ACTIVITY</p><h2>Happening now</h2></div>{["Order #OG-1048 was placed by Maya Rodriguez","Isabel Tan left a five-star product review","Golden Hour Oil is now out of stock","Refund request received for order #OG-1038"].map((event,i)=><p key={event}><span>{["●","★","!","↩"][i]}</span>{event}<small>{i+1}h ago</small></p>)}</section></> }
function ProductManager({query,setQuery,products:selectedProducts,selected,setSelected}:{query:string;setQuery:(v:string)=>void;products:string[][];selected:string[];setSelected:(v:string[])=>void}) { const all = selectedProducts.length > 0 && selected.length === selectedProducts.length; const toggle=(name:string)=>setSelected(selected.includes(name)?selected.filter(x=>x!==name):[...selected,name]); return <section className="manager"><div className="manager-tools"><div className="product-search">⌕<input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, SKU, or barcode"/></div><button>Filter ⌄</button><button>Export</button><button>Import</button><button className="primary-action">+ Add product</button></div>{selected.length>0&&<div className="bulk-bar"><b>{selected.length} selected</b><button>Archive</button><button>Duplicate</button><button>Delete</button></div>}<div className="manager-table"><div className="product-row product-heading"><input type="checkbox" checked={all} onChange={()=>setSelected(all?[]:selectedProducts.map(p=>p[0]))}/><span>PRODUCT</span><span>SKU</span><span>BRAND</span><span>PRICE</span><span>INVENTORY</span><span>STATUS</span></div>{selectedProducts.map(p=><div className="product-row" key={p[0]}><input type="checkbox" checked={selected.includes(p[0])} onChange={()=>toggle(p[0])}/><b>{p[0]}<small>Last updated today</small></b><span>{p[1]}</span><span>{p[2]}</span><span>{p[3]}</span><span className={p[4]==="0"||p[4]==="7"?"inventory-alert":""}>{p[4]} in stock</span><em className={p[5].replace(" ","-").toLowerCase()}>{p[5]}</em></div>)}</div></section> }
function OrderTable(){return <div className="order-table"><div className="order-row heading"><span>ORDER</span><span>CUSTOMER</span><span>TOTAL</span><span>PAYMENT</span><span>FULFILMENT</span></div>{orders.map(order=><div className="order-row" key={order[0]}><b>{order[0]}</b><span>{order[1]}</span><span>{order[2]}</span><em>{order[3]}</em><small>{order[4]}</small></div>)}</div>}
function ModulePanel({title}:{title:string}){const details:Record<string,string>={Orders:"Manage payment, fulfilment, tracking, refunds, notes, and invoices.",Categories:"Create nested categories, set sort order, feature them on the storefront, and manage SEO.",Brands:"Manage brand profiles, banners, descriptions, featured status, and collection visibility.",Collections:"Configure automated and manual collections for new arrivals, best sellers, campaigns, and offers.",Customers:"Review customer profiles, lifetime value, addresses, loyalty, notes, and purchase history.",Inventory:"Track warehouses, stock adjustments, purchase orders, transfers, reservations, and low-stock alerts.",Marketing:"Create coupons, bundle offers, flash sales, campaigns, and customer segments.",Reviews:"Moderate product reviews, mark featured feedback, reply to customers, and flag spam.",Content:"Manage homepage sections, banners, blog articles, media assets, and SEO content.",Reports:"Export sales, revenue, customer, product, inventory, coupon, payment, tax, and refund reports.",Payments:"Configure Stripe, PayHere, PayPal, COD, bank transfer, settlements, and refund logs.",Shipping:"Configure delivery zones, rates, courier partners, tracking, and pickup locations.",Loyalty:"Set points rules, membership tiers, birthday rewards, and referral rewards.","AI tools":"Generate product descriptions, SEO metadata, image alt text, product tags, sales insights, and stock forecasts.","Users & roles":"Manage staff, granular RBAC permissions, sessions, two-factor authentication, and access restrictions.",Settings:"Configure store details, currency, timezone, taxes, email, payment methods, and notification templates.","Audit logs":"Review login, product, order, inventory, customer, payment, and user-management activity.","System health":"Monitor server, API, database, cache, queue health, and error logs."}; return <section className="module-panel"><p className="eyebrow">ADMINISTRATION</p><h2>{title}</h2><p>{details[title] ?? "Manage this part of your Olivia Glow store."}</p><div className="module-placeholder"><span>✦</span><h3>{title} workspace</h3><p>This UI module is ready for a database-backed implementation.</p><button className="primary-action">Create {title === "Orders" ? "order" : title.slice(0,-1).toLowerCase()}</button></div></section>}
