const brands = [
  ["Olivia Glow", "Thoughtful skincare for your softest glow.", "OG"],
  ["Aurelia Botanics", "Botanical science for beautiful balance.", "AB"],
  ["Serein Lab", "Minimal formulas, maximum comfort.", "SL"],
  ["Nami Rituals", "Gentle rituals rooted in nature.", "NR"],
];
export default function Brands() { return <main className="utility-page"><header><a className="wordmark" href="/"><span className="brand-symbol"/>OLIVIA <em>GLOW</em></a><nav><a href="/shop">Shop</a><a href="/brands">Brands</a><a href="/search">Search</a></nav><a className="bag" href="/cart">Bag</a></header><section className="brand-hero"><p className="eyebrow">THE OLIVIA EDIT</p><h1>Brands with<br/><i>beautiful standards.</i></h1><p>We only make room for formulas that earn their place on your shelf.</p></section><section className="brands-grid">{brands.map(([name, description, initials],i)=><article key={name}><div className={`brand-monogram tone-${i}`}><span>{initials}</span></div><p className="eyebrow">CURATED PARTNER</p><h2>{name}</h2><p>{description}</p><a href="/shop">Shop the brand →</a></article>)}</section></main>; }
