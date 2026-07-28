"use client";

import { useState } from "react";

const saved = ["Morning Dew Serum", "Golden Hour Oil"];
export default function Wishlist() {
  const [items, setItems] = useState(saved);
  return <main className="utility-page"><header><a className="wordmark" href="/"><span className="brand-symbol"/>OLIVIA <em>GLOW</em></a><nav><a href="/shop">Shop</a><a href="/brands">Brands</a><a href="/search">Search</a></nav><a className="bag" href="/cart">Bag</a></header><section className="saved-page"><p className="eyebrow">YOUR EDIT</p><h1>Saved for <i>later.</i></h1><p className="saved-subtitle">The pieces that caught your eye, all in one place.</p>{items.length ? <div className="saved-grid">{items.map((item,i)=><article key={item}><div className={`saved-image ${i ? "amber" : "rose"}`}><button onClick={()=>setItems(items.filter(x=>x!==item))} aria-label={`Remove ${item}`}>×</button><div className={`bottle b${i ? 3 : 1}`}><strong>OLIVIA</strong><span>GLOW</span><i>{i ? "FACE OIL" : "SERUM"}</i></div></div><h2>{item}</h2><p>{i ? "$54.00" : "$48.00"}</p><button className="button dark">Move to bag →</button></article>)}</div> : <div className="empty-state"><span>♡</span><h2>Your saved edit is empty.</h2><a className="button dark" href="/shop">Explore the collection →</a></div>}</section></main>;
}
