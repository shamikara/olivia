"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PRODUCTS_CATALOG, type BeautyProduct } from "../data/products";

const CART_KEY = "olivia.cart.v1";
const WISH_KEY = "olivia.wishlist.v1";

export interface CartLine {
  id: string;
  quantity: number;
}

export interface CartEntry extends CartLine {
  product: BeautyProduct;
  lineTotal: number;
}

interface StoreValue {
  lines: CartEntry[];
  itemCount: number;
  subtotal: number;
  wishlist: string[];
  isCartOpen: boolean;
  isNavOpen: boolean;
  quickViewId: string | null;
  toast: string;
  addToCart: (id: string, quantity?: number) => void;
  setQuantity: (id: string, quantity: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  isWishlisted: (id: string) => boolean;
  openCart: () => void;
  closeCart: () => void;
  openNav: () => void;
  closeNav: () => void;
  openQuickView: (id: string) => void;
  closeQuickView: () => void;
  showToast: (message: string) => void;
  dismissToast: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function readStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [isCartOpen, setCartOpen] = useState(false);
  const [isNavOpen, setNavOpen] = useState(false);
  const [quickViewId, setQuickViewId] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  // Hydrate from localStorage after mount so server and client markup match.
  useEffect(() => {
    setCart(readStored<CartLine[]>(CART_KEY, []));
    setWishlist(readStored<string[]>(WISH_KEY, []));
  }, []);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    window.localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  // Lock background scrolling while a full-screen overlay is showing.
  useEffect(() => {
    const locked = isCartOpen || isNavOpen || quickViewId !== null;
    document.body.style.overflow = locked ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isCartOpen, isNavOpen, quickViewId]);

  // Escape closes whichever overlay is on top.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setQuickViewId(null);
      setCartOpen(false);
      setNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((message: string) => setToast(message), []);

  const addToCart = useCallback((id: string, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((line) => line.id === id);
      if (existing) {
        return prev.map((line) =>
          line.id === id ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }
      return [...prev, { id, quantity }];
    });
    const product = PRODUCTS_CATALOG.find((item) => item.id === id);
    setToast(product ? `${product.shortName} added to your bag` : "Added to your bag");
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    setCart((prev) =>
      quantity < 1
        ? prev.filter((line) => line.id !== id)
        : prev.map((line) => (line.id === id ? { ...line, quantity } : line)),
    );
  }, []);

  const removeFromCart = useCallback((id: string) => {
    setCart((prev) => prev.filter((line) => line.id !== id));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist((prev) => {
      const saved = prev.includes(id);
      setToast(saved ? "Removed from your saved edit" : "Saved to your edit");
      return saved ? prev.filter((item) => item !== id) : [...prev, id];
    });
  }, []);

  const value = useMemo<StoreValue>(() => {
    const lines = cart
      .map((line) => {
        const product = PRODUCTS_CATALOG.find((item) => item.id === line.id);
        return product
          ? { ...line, product, lineTotal: product.priceLKR * line.quantity }
          : null;
      })
      .filter((line): line is CartEntry => line !== null);

    return {
      lines,
      itemCount: lines.reduce((total, line) => total + line.quantity, 0),
      subtotal: lines.reduce((total, line) => total + line.lineTotal, 0),
      wishlist,
      isCartOpen,
      isNavOpen,
      quickViewId,
      toast,
      addToCart,
      setQuantity,
      removeFromCart,
      clearCart,
      toggleWishlist,
      isWishlisted: (id: string) => wishlist.includes(id),
      openCart: () => {
        setNavOpen(false);
        setCartOpen(true);
      },
      closeCart: () => setCartOpen(false),
      openNav: () => setNavOpen(true),
      closeNav: () => setNavOpen(false),
      openQuickView: (id: string) => setQuickViewId(id),
      closeQuickView: () => setQuickViewId(null),
      showToast,
      dismissToast: () => setToast(""),
    };
  }, [
    cart,
    wishlist,
    isCartOpen,
    isNavOpen,
    quickViewId,
    toast,
    addToCart,
    setQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    showToast,
  ]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
