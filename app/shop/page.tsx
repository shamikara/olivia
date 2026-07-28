"use client";

import { useState } from "react";

const catalog = [
  ["Cloud Milk Cleanser", "Gentle daily cleanse", "$32.00", "peach", "Best seller"],
  ["Morning Dew Serum", "Hyaluronic + niacinamide", "$48.00", "rose", "New"],
  ["Velvet Barrier Cream", "Ceramides + squalane", "$42.00", "cream", ""],
  ["Golden Hour Oil", "Nourishing face oil", "$54.00", "amber", ""],
  ["Petal Soft Mist", "Hydrating face mist", "$28.00", "peach", ""],
  ["Soft Reset Mask", "Comforting overnight mask", "$46.00", "cream", ""],
];

export default function Shop() {
  const [filter, setFilter] = useState("All products");
  const [cart, setCart] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const visible = filter === "All products" ? catalog : catalog.filter((_, i) => filter === "Best sellers" ? i < 3 : i > 0);
  const add = (name: string) => { setCart([...cart, name]); setNotice(`${name} is in your bag.`); };
  return <main className="shop-page">
    <div className="announcement">Complimentary shipping on orders over $75 <span>•</span> A little glow, on us</div>
    <header><a className="wordmark" href="/"><span className="brand-symbol" aria-hidden="true"/>OLIVIA <em>GLOW</em></a><nav><a href="/shop">Shop</a><a href="/#rituals">Rituals</a><a href="/#story">Our story</a><a href="/#journal">Journal</a></nav><div className="actions"><a className="search" href="#catalog" aria-label="Search">⌕</a><button className="account" aria-label="Account">◯</button><button className="bag shop-bag" aria-label="Shopping bag">Bag {cart.length ? <i>{cart.length}</i> : null}</button></div></header>
    <section className="shop-hero"><p className="eyebrow">SHOP OLIVIA GLOW</p><h1>The everyday<br/><i>essentials.</i></h1><p>Simple, considered formulas for every skin day.</p></section>
    <section className="shop-catalog" id="catalog"><div className="shop-tools"><div className="filter-set">{["All products", "Best sellers", "New arrivals"].map(item=><button key={item} className={filter===item?"selected":""} onClick={()=>setFilter(item)}>{item}</button>)}</div><span>{visible.length} products</span></div><div className="product-grid shop-grid">{visible.map(([name, kind, price, tone, tag], index) => <article className="product" key={name}><a href={name === "Morning Dew Serum" ? "/product/morning-dew-serum" : "#catalog"} className={`product-image ${tone}`}><button className="heart" onClick={(e)=>e.preventDefault()} aria-label={`Save ${name}`}>♡</button>{tag && <small>{tag}</small>}<div className={`bottle b${index%4}`}><strong>OLIVIA</strong><span>GLOW</span><i>{name.includes("Serum") ? "SERUM" : name.includes("Cream") ? "CREAM" : name.includes("Oil") ? "FACE OIL" : "SKINCARE"}</i></div></a><div className="product-info"><div><h3>{name}</h3><p>{kind}</p></div><strong>{price}</strong></div><button className="shop-add" onClick={()=>add(name)}>Add to bag <b>+</b></button></article>)}</div></section>
    {notice && <div className="toast" role="status">{notice}<button onClick={()=>setNotice("")}>×</button></div>}
    <footer><div className="footer-brand"><a className="wordmark" href="/"><span className="brand-symbol" aria-hidden="true"/>OLIVIA <em>GLOW</em></a><p>Thoughtful skincare for your softest glow.</p></div><div><b>Shop</b><a href="/shop">Best sellers</a><a href="/shop">New arrivals</a></div><div><b>About</b><a href="/#story">Our story</a><a href="/#journal">Journal</a></div><div><b>Follow along</b><a href="#">Instagram</a><a href="#">Pinterest</a></div><small>© 2026 Olivia Glow. Made with care.</small></footer>
  </main>;
}
