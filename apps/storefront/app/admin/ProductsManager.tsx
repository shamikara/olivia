"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MAX_GALLERY_IMAGES } from "../lib/product-schema";
import type { BeautyProduct, Category } from "../data/products";

const CATEGORIES: Category[] = [
  "SERUM",
  "MOISTURIZERS",
  "TONER",
  "CLEANSER",
  "SUN CREAM",
  "FACE MASK",
  "COLLAGEN",
  "HAIR CARE",
  "DEVICE",
];

const BLANK: BeautyProduct = {
  id: "",
  name: "",
  shortName: "",
  brand: "",
  category: "SERUM",
  priceLKR: 0,
  image: "",
  description: "",
  benefits: [],
  stockCount: 0,
};

const money = (value: number) => `LKR ${Math.round(value).toLocaleString("en-US")}`;

// Mirrors the id the server assigns in product-schema.ts's normaliseProduct,
// so an image uploaded before the first save lands in the same media
// folder the product ends up with.
const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);

export function ProductsManager() {
  const [products, setProducts] = useState<BeautyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<BeautyProduct | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "bad"; text: string } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products ?? []);
    } catch {
      setMessage({ kind: "bad", text: "Could not load products" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return products;
    return products.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(needle));
  }, [products, query]);

  const save = async (product: BeautyProduct) => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(isNew ? "/api/admin/products" : `/api/admin/products/${product.id}`, {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ kind: "bad", text: data.error ?? "Could not save" });
        return;
      }
      setMessage({ kind: "ok", text: `Saved “${data.product.name}”` });
      setEditing(null);
      setIsNew(false);
      await load();
    } catch {
      setMessage({ kind: "bad", text: "Network error while saving" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async (product: BeautyProduct) => {
    if (!window.confirm(`Delete “${product.name}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage({ kind: "bad", text: data.error ?? "Could not delete" });
      return;
    }
    setMessage({ kind: "ok", text: `Deleted “${product.name}”` });
    await load();
  };

  return (
    <section className="manager">
      <div className="manager-tools">
        <div className="product-search">
          ⌕
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, brand or category"
          />
        </div>
        <button
          className="primary-action"
          onClick={() => {
            setEditing({ ...BLANK });
            setIsNew(true);
            setMessage(null);
          }}
        >
          + Add product
        </button>
      </div>

      {message && <div className={`admin-flash ${message.kind}`}>{message.text}</div>}

      {loading ? (
        <p className="admin-empty">Loading products…</p>
      ) : (
        <div className="manager-table">
          <div className="product-row product-heading admin-grid-row">
            <span>Image</span>
            <span>Product</span>
            <span>Brand</span>
            <span>Category</span>
            <span>Price</span>
            <span>Stock</span>
            <span>Actions</span>
          </div>

          {visible.map((product) => (
            <div className="product-row admin-grid-row" key={product.id}>
              <img className="admin-thumb" src={product.image} alt="" />
              <b>
                {product.name}
                <small>{product.id}</small>
              </b>
              <span>{product.brand}</span>
              <span>{product.category}</span>
              <span>
                {money(product.priceLKR)}
                {product.originalPriceLKR ? <s> {money(product.originalPriceLKR)}</s> : null}
              </span>
              <em className={product.stockCount === 0 ? "out-of-stock" : product.stockCount <= 5 ? "low-stock" : ""}>
                {product.stockCount}
              </em>
              <span className="admin-actions-cell">
                <button
                  onClick={() => {
                    setEditing(product);
                    setIsNew(false);
                    setMessage(null);
                  }}
                >
                  Edit
                </button>
                <button className="danger" onClick={() => remove(product)}>
                  Delete
                </button>
              </span>
            </div>
          ))}

          {visible.length === 0 && <p className="admin-empty">No products match “{query}”.</p>}
        </div>
      )}

      {editing && (
        <ProductEditor
          product={editing}
          isNew={isNew}
          saving={saving}
          onCancel={() => {
            setEditing(null);
            setIsNew(false);
          }}
          onSave={save}
        />
      )}
    </section>
  );
}

function ProductEditor({
  product,
  isNew,
  saving,
  onCancel,
  onSave,
}: {
  product: BeautyProduct;
  isNew: boolean;
  saving: boolean;
  onCancel: () => void;
  onSave: (product: BeautyProduct) => void;
}) {
  const [draft, setDraft] = useState<BeautyProduct>(product);
  const [uploading, setUploading] = useState<"image" | "gallery" | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const mainInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);

  const gallery = draft.gallery ?? [];
  const galleryFull = gallery.length >= MAX_GALLERY_IMAGES;

  const setGallery = (next: string[]) =>
    setDraft((current) => ({ ...current, gallery: next.length ? next : undefined }));

  /** Order decides what customers see second, third and so on. */
  const moveGallery = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[index], next[target]] = [next[target], next[index]];
    setGallery(next);
  };

  const set = <K extends keyof BeautyProduct>(key: K, value: BeautyProduct[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const upload = async (slot: "image" | "gallery", file: File) => {
    let productId = draft.id;
    if (!productId) {
      if (!draft.name.trim()) {
        setUploadError("Enter a product name before uploading images");
        return;
      }
      // Locked in for the rest of this editing session — renaming afterwards
      // doesn't move the product's stored media.
      productId = `p-${slugify(draft.name)}`;
      setDraft((current) => ({ ...current, id: productId! }));
    }

    setUploading(slot);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("name", draft.name || file.name);
      body.append("productId", productId);
      body.append("role", slot);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Upload failed");
        return;
      }
      if (slot === "image") {
        set("image", data.url);
      } else {
        // Appends: the gallery is a list, not a fixed set of slots.
        setGallery([...gallery, data.url].slice(0, MAX_GALLERY_IMAGES));
      }
    } catch {
      setUploadError("Network error during upload");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="admin-editor-backdrop" onClick={onCancel} role="presentation">
      <div className="admin-editor" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <header>
          <h2>{isNew ? "New product" : draft.name}</h2>
          <button onClick={onCancel} aria-label="Close">
            ✕
          </button>
        </header>

        <div className="admin-editor-body">
          <div className="admin-field-grid">
            <label>
              Title
              <input value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label>
              Short name (used on cards)
              <input value={draft.shortName} onChange={(e) => set("shortName", e.target.value)} />
            </label>
            <label>
              Brand
              <input value={draft.brand} onChange={(e) => set("brand", e.target.value)} />
            </label>
            <label>
              Category
              <select value={draft.category} onChange={(e) => set("category", e.target.value as Category)}>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Price (LKR)
              <input
                type="number"
                value={draft.priceLKR}
                onChange={(e) => set("priceLKR", Number(e.target.value))}
              />
            </label>
            <label>
              Was price (optional)
              <input
                type="number"
                value={draft.originalPriceLKR ?? ""}
                onChange={(e) => set("originalPriceLKR", e.target.value ? Number(e.target.value) : undefined)}
              />
            </label>
            <label>
              Stock
              <input
                type="number"
                value={draft.stockCount}
                onChange={(e) => set("stockCount", Number(e.target.value))}
              />
            </label>
            <label>
              Size
              <input value={draft.size ?? ""} onChange={(e) => set("size", e.target.value)} />
            </label>
            <label>
              Badge
              <input
                value={draft.tag ?? ""}
                onChange={(e) => set("tag", e.target.value)}
                placeholder="e.g. Bestseller"
              />
            </label>
          </div>

          <div className="admin-image-row">
            <div className="admin-image-slot">
              <span>Main image</span>
              {draft.image ? (
                <img src={draft.image} alt="" />
              ) : (
                <div className="admin-image-empty">No image</div>
              )}
              <input
                ref={mainInput}
                type="file"
                accept="image/webp,image/jpeg,image/png,image/avif"
                hidden
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void upload("image", file);
                  e.target.value = "";
                }}
              />
              <button onClick={() => mainInput.current?.click()} disabled={uploading !== null}>
                {uploading === "image" ? "Uploading…" : draft.image ? "Replace" : "Upload"}
              </button>
            </div>

            {/*
              The gallery is an ordered list, not fixed slots: position decides
              what the product page shows second, third and so on.
            */}
            {gallery.map((src, index) => (
              <div className="admin-image-slot" key={src + index}>
                <span>Image {index + 2}</span>
                <img src={src} alt="" />
                <div className="admin-image-order">
                  <button
                    onClick={() => moveGallery(index, -1)}
                    disabled={index === 0}
                    aria-label={`Move image ${index + 2} earlier`}
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => moveGallery(index, 1)}
                    disabled={index === gallery.length - 1}
                    aria-label={`Move image ${index + 2} later`}
                  >
                    ▶
                  </button>
                </div>
                <button
                  className="danger"
                  onClick={() => setGallery(gallery.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
            ))}

            {!galleryFull && (
              <div className="admin-image-slot">
                <span>Add image</span>
                <div className="admin-image-empty">Empty</div>
                <input
                  ref={galleryInput}
                  type="file"
                  accept="image/webp,image/jpeg,image/png,image/avif"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload("gallery", file);
                    e.target.value = "";
                  }}
                />
                <button onClick={() => galleryInput.current?.click()} disabled={uploading !== null}>
                  {uploading === "gallery" ? "Uploading…" : "Upload"}
                </button>
              </div>
            )}
          </div>
          <p className="admin-hint">
            Up to {MAX_GALLERY_IMAGES + 1} images per product — the main one plus {MAX_GALLERY_IMAGES}{" "}
            more, shown in the order above. Max 500KB each. Anything is accepted and converted to
            WebP, so upload the format you have — just keep it under the size.
          </p>
          {uploadError && <p className="admin-flash bad">{uploadError}</p>}

          <label className="admin-block">
            Description
            <textarea rows={4} value={draft.description} onChange={(e) => set("description", e.target.value)} />
          </label>

          <label className="admin-block">
            Benefits (one per line)
            <textarea
              rows={4}
              value={draft.benefits.join("\n")}
              onChange={(e) => set("benefits", e.target.value.split("\n"))}
            />
          </label>

          <label className="admin-block">
            How to use
            <textarea rows={2} value={draft.howToUse ?? ""} onChange={(e) => set("howToUse", e.target.value)} />
          </label>

          <label className="admin-block">
            Key ingredients
            <textarea
              rows={2}
              value={draft.keyIngredients ?? ""}
              onChange={(e) => set("keyIngredients", e.target.value)}
            />
          </label>
        </div>

        <footer>
          <button onClick={onCancel}>Cancel</button>
          <button className="primary-action" onClick={() => onSave(draft)} disabled={saving}>
            {saving ? "Saving…" : isNew ? "Create product" : "Save changes"}
          </button>
        </footer>
      </div>
    </div>
  );
}
