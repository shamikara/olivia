"use client";

import { useState } from "react";

const products = [
  { name: "Cloud Milk Cleanser", kind: "Gentle daily cleanse", price: "$32.00", tone: "peach", tag: "Best seller" },
  { name: "Morning Dew Serum", kind: "Hyaluronic + niacinamide", price: "$48.00", tone: "rose", tag: "New" },
  { name: "Velvet Barrier Cream", kind: "Ceramides + squalane", price: "$42.00", tone: "cream", tag: "" },
  { name: "Golden Hour Oil", kind: "Nourishing face oil", price: "$54.00", tone: "amber", tag: "" },
];

function Bag({ count, onClick }: { count: number; onClick: () => void }) { return <button className="icon-btn bag" onClick={onClick} aria-label="Open shopping bag"><span>Bag</span>{count > 0 && <i>{count}</i>}</button>; }

export default function Home() {
  const [cart, setCart] = useState<string[]>([]);
  const [drawer, setDrawer] = useState(false);
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);
  const add = (name: string) => { setCart([...cart, name]); setDrawer(true); };
  return <main>
    <div className="announcement">Complimentary shipping on orders over $75 <span>•</span> A little glow, on us</div>
    <header>
      <button className="menu" aria-label="Open menu">☰</button>
      <a className="wordmark" href="#top"><span className="brand-symbol" aria-hidden="true"/>OLIVIA <em>GLOW</em></a>
      <nav><a href="/shop">Shop</a><a href="#rituals">Rituals</a><a href="#story">Our story</a><a href="#journal">Journal</a></nav>
      <div className="actions"><button className="search" aria-label="Search">⌕</button><button className="account" aria-label="Account">◯</button><Bag count={cart.length} onClick={() => setDrawer(true)} /></div>
    </header>
    <section className="hero" id="top">
      <img src="/images/olivia-hero.png" alt="Olivia Glow skincare arranged on ivory pedestals" />
      <div className="hero-copy"><p className="eyebrow">SKINCARE, SOFTER</p><h1>Your skin,<br/><i>in its glow era.</i></h1><p className="hero-text">Intuitive formulas for the beautifully ordinary moments of your day.</p><a className="button dark" href="/shop">Shop the ritual <b>→</b></a></div>
      <div className="hero-note"><span>01</span><span>Made for your<br/>everyday radiance</span></div>
    </section>
    <section className="intro"><p className="eyebrow">THE OLIVIA WAY</p><h2>Less noise. More <i>nourishment.</i></h2><p>We make uncomplicated, high-performance skincare that makes taking care of yourself feel like a small luxury — every single day.</p></section>
    <section className="collections" id="rituals"><div className="section-head"><div><p className="eyebrow">SHOP BY RITUAL</p><h2>A moment for <i>you.</i></h2></div><a href="#shop">Explore all rituals <b>→</b></a></div><div className="collection-grid">
      <article className="collection golden"><span>01</span><div><h3>The Morning Edit</h3><p>Fresh starts, bottled</p><a href="#shop">Shop ritual →</a></div></article>
      <article className="collection petal"><span>02</span><div><h3>Barrier, Beloved</h3><p>Your daily comfort layer</p><a href="#shop">Shop ritual →</a></div></article>
      <article className="collection lavender"><span>03</span><div><h3>Night, Softly</h3><p>Wind down, glow on</p><a href="#shop">Shop ritual →</a></div></article>
    </div></section>
    <section className="products" id="shop"><div className="section-head"><div><p className="eyebrow">THE DAILY ESSENTIALS</p><h2>Meet your new <i>favourites.</i></h2></div><a href="#shop">Shop all products <b>→</b></a></div><div className="product-grid">{products.map((p, idx) => <article className="product" key={p.name}><div className={`product-image ${p.tone}`}><button className="heart" aria-label={`Save ${p.name}`}>♡</button>{p.tag && <small>{p.tag}</small>}<div className={`bottle b${idx}`}><strong>OLIVIA</strong><span>GLOW</span><i>{idx === 0 ? "CLEANSER" : idx === 1 ? "SERUM" : idx === 2 ? "CREAM" : "FACE OIL"}</i></div><button className="quick" onClick={() => add(p.name)}>Quick add <b>+</b></button></div><div className="product-info"><div><h3>{p.name}</h3><p>{p.kind}</p></div><strong>{p.price}</strong></div></article>)}</div></section>
    <section className="quote"><p className="eyebrow">WHY WE DO IT</p><blockquote>“The best kind of skincare is the kind that gives you back a little more <i>you.</i>”</blockquote><span>— Olivia Chen, Founder</span></section>
    <section className="story" id="story"><div className="story-image"><img src="/images/olivia-hero.png" alt="Olivia Glow beauty essentials"/></div><div className="story-copy"><p className="eyebrow">OUR PHILOSOPHY</p><h2>Beauty isn’t a standard.<br/>It’s a <i>feeling.</i></h2><p>Olivia Glow began with one belief: that effective skincare should feel as good as it works. Every formula is consciously crafted, clinically considered, and made to fit beautifully into real life.</p><a className="text-link" href="#journal">Meet Olivia <b>→</b></a><div className="values"><span><b>100%</b> vegan</span><span><b>Always</b> cruelty-free</span><span><b>Made</b> with care</span></div></div></section>
    <section className="reviews"><p className="eyebrow">THE GLOW GETTERS</p><h2>Loved in the <i>little moments.</i></h2><div className="review-grid"><article><div>★★★★★</div><p>“My skin has never felt this calm. The whole ritual is such a beautiful reset at the end of the day.”</p><span>— Maya R. <b>Verified customer</b></span></article><article><div>★★★★★</div><p>“The Morning Dew Serum gives me that ‘I slept eight hours’ look — even when I definitely didn’t.”</p><span>— Isabel T. <b>Verified customer</b></span></article><article><div>★★★★★</div><p>“Beautiful formulas, beautiful packaging. It’s skincare I actually look forward to using.”</p><span>— Chloe M. <b>Verified customer</b></span></article></div></section>
    <section className="newsletter"><div><p className="eyebrow">A LITTLE NOTE FROM US</p><h2>Good things,<br/><i>in your inbox.</i></h2></div>{joined ? <p className="success">You’re on the list. Welcome to the glow. ✦</p> : <form onSubmit={(e) => {e.preventDefault(); if(email) setJoined(true)}}><label htmlFor="email">Email address</label><div><input id="email" required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/><button aria-label="Join newsletter">→</button></div><small>By subscribing, you agree to our privacy policy.</small></form>}</section>
    <footer><div className="footer-brand"><a className="wordmark" href="#top"><span className="brand-symbol" aria-hidden="true"/>OLIVIA <em>GLOW</em></a><p>Thoughtful skincare for your softest glow.</p></div><div><b>Shop</b><a href="#shop">Best sellers</a><a href="#shop">New arrivals</a><a href="#rituals">Rituals</a></div><div><b>About</b><a href="#story">Our story</a><a href="#journal">Journal</a><a href="#">Contact</a></div><div><b>Follow along</b><a href="#">Instagram</a><a href="#">TikTok</a><a href="#">Pinterest</a></div><small>© 2026 Olivia Glow. Made with care.</small></footer>
    {drawer && <aside className="drawer" aria-label="Shopping bag"><button className="close" onClick={()=>setDrawer(false)}>×</button><p className="eyebrow">YOUR BAG</p><h2>Good choices.</h2>{cart.length ? <><div className="cart-items">{cart.map((item,i)=><div key={i}><span className="mini-product">OG</span><p>{item}<small>One-time purchase</small></p><button onClick={()=>setCart(cart.filter((_,x)=>x!==i))}>Remove</button></div>)}</div><div className="cart-total"><span>Subtotal</span><strong>${cart.length * 42}.00</strong></div><button className="button dark checkout">Checkout securely →</button></> : <p className="empty">Your bag is waiting for something lovely.</p>}</aside>}
  </main>;
}
