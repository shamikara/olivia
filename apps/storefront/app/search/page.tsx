"use client";

import { useMemo, useState } from "react";

const products = [
  { name: "Cloud Milk Cleanser", type: "Cleanser", price: 32, tone: "peach" },
  { name: "Morning Dew Serum", type: "Serum", price: 48, tone: "rose" },
  { name: "Velvet Barrier Cream", type: "Moisturizer", price: 42, tone: "cream" },
  { name: "Golden Hour Oil", type: "Treatment", price: 54, tone: "amber" },
];

export default function Search() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const filtered = useMemo(() => products.filter(p => (type === "All" || p.type === type) && p.name.toLowerCase().includes(query.toLowerCase())), [query, type]);
  return <main className="utility-page"><header><a className="wordmark" href="/"><span className="brand-symbol"/>OLIVIA <em>GLOW</em></a><nav><a href="/shop">Shop</a><a href="/brands">Brands</a><a href="/search">Search</a></nav><a className="bag" href="/cart">Bag</a></header><section className="utility-hero"><p className="eyebrow">DISCOVER OLIVIA GLOW</p><h1>Find your next<br/><i>favourite.</i></h1><div className="search-field"><span>⌕</span><input autoFocus value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, concerns, ingredients..."/><button onClick={()=>setQuery("")}>Clear</button></div><div className="popular-searches"><span>Popular:</span>{["Hydration", "Sensitive skin", "Vitamin C", "Barrier repair"].map(item=><button key={item} onClick={()=>setQuery(item)}>{item}</button>)}</div></section><section className="search-results"><div className="filter-set">{["All", "Cleanser", "Serum", "Moisturizer", "Treatment"].map(item=><button className={type===item?"selected":""} key={item} onClick={()=>setType(item)}>{item}</button>)}</div><p className="result-count">{filtered.length} results {query && <>for “{query}”</>}</p><div className="search-list">{filtered.map((p, i)=><a href={p.name === "Morning Dew Serum" ? "/product/morning-dew-serum" : "/shop"} className="search-product" key={p.name}><div className={`search-product-image ${p.tone}`}><div className={`bottle b${i}`}><strong>OLIVIA</strong><span>GLOW</span><i>{p.type}</i></div></div><div><p>{p.type}</p><h2>{p.name}</h2><b>${p.price}.00</b></div><span>View product →</span></a>)}</div></section></main>;
}
