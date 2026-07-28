"use client";

import { useState } from "react";
export default function Cart() {
  const [qty, setQty] = useState(1);
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(false);
  const total = 48 * qty;
  return <main className="utility-page"><header><a className="wordmark" href="/"><span className="brand-symbol"/>OLIVIA <em>GLOW</em></a><nav><a href="/shop">Shop</a><a href="/brands">Brands</a><a href="/search">Search</a></nav><a className="bag" href="/cart">Bag <i>1</i></a></header><section className="cart-page"><div><p className="eyebrow">YOUR BAG</p><h1>A little glow<br/><i>is on its way.</i></h1><article className="cart-line"><div className="cart-image rose"><div className="bottle b1"><strong>OLIVIA</strong><span>GLOW</span><i>SERUM</i></div></div><div className="cart-name"><h2>Morning Dew Serum</h2><p>30 ml / One-time purchase</p><button>Remove</button></div><div className="quantity"><button onClick={()=>setQty(Math.max(1,qty-1))}>−</button><span>{qty}</span><button onClick={()=>setQty(qty+1)}>+</button></div><b>${total}.00</b></article><a className="continue-link" href="/shop">← Continue shopping</a></div><aside className="order-summary"><p className="eyebrow">ORDER SUMMARY</p><div><span>Subtotal</span><b>${total}.00</b></div><div><span>Shipping</span><b>Calculated at checkout</b></div><div className="discount"><input value={code} onChange={e=>setCode(e.target.value)} placeholder="Discount or gift card"/><button onClick={()=>setApplied(Boolean(code))}>Apply</button></div>{applied && <small className="applied">Code applied — 10% will be reflected at checkout.</small>}<div className="summary-total"><span>Total</span><strong>${total}.00</strong></div><button className="button dark checkout">Secure checkout →</button><small>Taxes and delivery calculated at checkout.</small></aside></section></main>;
}
