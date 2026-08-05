"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { BeautyProduct } from "../data/products";
import { formatLKR } from "../data/products";
import {
  answer,
  greeting,
  handoffMessage,
  orderLookup,
  understand,
  type ChatAnswer,
  type ChatContext,
} from "../lib/chat-script";
import { usePublicSettings, whatsappHref } from "../lib/public-settings";
import { useStore } from "../lib/store";
import { CloseIcon, SendIcon, WhatsAppIcon } from "./Icons";

type MessageBody =
  | { kind: "bot"; text: string }
  | { kind: "user"; text: string }
  | { kind: "products"; products: BeautyProduct[] }
  | { kind: "link"; href: string; label: string };

type Message = MessageBody & { id: number; at: string };

const TEASER_KEY = "olivia.chat.teaser.v1";

function clock(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/**
 * The floating skin concierge.
 *
 * A scripted assistant that answers the questions the team gets asked twenty
 * times a day — routine, delivery, authenticity, order status — using the live
 * catalogue and store settings, then hands anything else to a real person on
 * WhatsApp with the conversation summarised so the customer doesn't repeat
 * themselves. See `lib/chat-script` for the script itself.
 */
export function ChatWidget() {
  const { catalog, lines, itemCount, addToCart, openCart } = useStore();
  const settings = usePublicSettings();

  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [options, setOptions] = useState<{ id: string; label: string }[]>([]);
  const [ask, setAsk] = useState<"order-reference" | null>(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState("");
  const [teaser, setTeaser] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const timers = useRef<number[]>([]);
  const nextId = useRef(0);
  const topics = useRef<string[]>([]);

  const context: ChatContext = { catalog, settings, cartCount: itemCount };

  const clearTimers = useCallback(() => {
    for (const timer of timers.current) window.clearTimeout(timer);
    timers.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const push = useCallback((body: MessageBody) => {
    setMessages((prev) => [...prev, { ...body, id: nextId.current++, at: clock() }]);
  }, []);

  /*
   * Bubbles arrive one at a time with the typing indicator between them. The
   * pause scales with the length of the message so a long answer doesn't land
   * instantly while a two-word one takes just as long.
   */
  const deliver = useCallback(
    (reply: ChatAnswer) => {
      clearTimers();
      setOptions([]);
      setAsk(null);
      setTyping(true);

      const instant = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      let delay = instant ? 0 : 420;

      for (const text of reply.bubbles) {
        const at = delay;
        timers.current.push(window.setTimeout(() => push({ kind: "bot", text }), at));
        delay += instant ? 0 : 340 + Math.min(text.length * 7, 620);
      }

      if (reply.products?.length) {
        const products = reply.products;
        timers.current.push(window.setTimeout(() => push({ kind: "products", products }), delay));
        delay += instant ? 0 : 260;
      }

      if (reply.link) {
        const link = reply.link;
        timers.current.push(
          window.setTimeout(() => push({ kind: "link", href: link.href, label: link.label }), delay),
        );
        delay += instant ? 0 : 200;
      }

      timers.current.push(
        window.setTimeout(() => {
          setTyping(false);
          setOptions(reply.options);
          setAsk(reply.ask ?? null);
        }, delay),
      );
    },
    [clearTimers, push],
  );

  const whatsappMessage = useCallback(
    () =>
      handoffMessage(
        topics.current,
        lines.map((line) => ({ name: line.product.name, quantity: line.quantity })),
      ),
    [lines],
  );

  const handoff = useCallback(
    (message?: string) => {
      window.open(whatsappHref(settings, message ?? whatsappMessage()), "_blank", "noopener");
    },
    [settings, whatsappMessage],
  );

  /*
   * These three are plain handlers rather than memoised callbacks: they close
   * over `context`, which is rebuilt every render, so memoising them would only
   * buy a dependency array that has to be kept honest for no benefit — nothing
   * downstream of them is memoised either.
   */
  function choose(option: { id: string; label: string }) {
    push({ kind: "user", text: option.label });
    topics.current.push(option.label);
    setOptions([]);

    if (option.id === "do:whatsapp") {
      handoff();
      deliver({
        bubbles: ["Opened WhatsApp for you — everything you told me is already in the message."],
        options: [{ id: "root", label: "Back to the menu" }],
      });
      return;
    }

    if (option.id === "do:bag") {
      const bag = [
        "Hi Olivia Glow, I'd like to order this:",
        ...lines.map((line) => `• ${line.quantity} × ${line.product.name} — ${formatLKR(line.lineTotal)}`),
      ].join("\n");
      handoff(bag);
      deliver({
        bubbles: ["Your bag is in the chat — the team will confirm stock and delivery from there."],
        options: [{ id: "do:cart", label: "Open my bag" }, { id: "root", label: "Back to the menu" }],
      });
      return;
    }

    if (option.id === "do:cart") {
      setOpen(false);
      openCart();
      return;
    }

    deliver(answer(option.id, context));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text || typing) return;
    push({ kind: "user", text });
    setDraft("");
    topics.current.push(text);

    if (ask === "order-reference") {
      deliver(orderLookup(text));
      return;
    }

    const read = understand(text, catalog);
    if (read.concern) {
      deliver(answer(`concern:${read.concern.key}`, context));
    } else if (read.node) {
      deliver(answer(read.node, context));
    } else if (read.products?.length) {
      deliver({
        bubbles: [`Here's what I have matching “${text}”:`],
        products: read.products,
        options: [
          { id: "concern", label: "Help me pick a routine" },
          { id: "do:whatsapp", label: "Ask the team" },
          { id: "root", label: "Something else" },
        ],
      });
    } else {
      deliver(answer("unknown", context));
    }
  }

  function add(product: BeautyProduct) {
    addToCart(product.id);
    deliver({
      bubbles: [`${product.shortName} is in your bag. Anything else you'd like me to find?`],
      options: [
        { id: "do:cart", label: "Open my bag" },
        { id: "concern", label: "Keep looking" },
        { id: "do:whatsapp", label: "Order on WhatsApp" },
      ],
    });
  }

  // Start the conversation the first time the panel opens, not on mount.
  useEffect(() => {
    if (!open || started) return;
    setStarted(true);
    deliver(greeting({ catalog, settings, cartCount: itemCount }));
  }, [open, started, deliver, catalog, settings, itemCount]);

  useEffect(() => {
    const log = logRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [messages, typing, options]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /*
   * A single nudge per session. Anything more insistent than this reads as a
   * pop-up ad on a site whose whole promise is that it feels expensive.
   */
  useEffect(() => {
    if (open) return;
    let seen = true;
    try {
      seen = window.sessionStorage.getItem(TEASER_KEY) === "1";
    } catch {
      /* storage blocked — skip the nudge rather than nag every navigation */
    }
    if (seen) return;
    const timer = window.setTimeout(() => setTeaser(true), 9000);
    return () => window.clearTimeout(timer);
  }, [open]);

  const dismissTeaser = useCallback(() => {
    setTeaser(false);
    try {
      window.sessionStorage.setItem(TEASER_KEY, "1");
    } catch {
      /* nothing to remember it with */
    }
  }, []);

  const toggle = () => {
    dismissTeaser();
    setOpen((prev) => !prev);
  };

  return (
    <>
      {teaser && !open && (
        <div className="chat-teaser">
          <button type="button" onClick={toggle}>
            Not sure what suits your skin? Ask me — it takes a minute.
          </button>
          <button type="button" className="chat-teaser-close" onClick={dismissTeaser} aria-label="Dismiss">
            <CloseIcon size={14} />
          </button>
        </div>
      )}

      <button
        type="button"
        className="chat-fab"
        onClick={toggle}
        aria-expanded={open}
        aria-label={open ? "Close the chat" : "Chat with Olivia Glow"}
      >
        {open ? <CloseIcon size={22} /> : <WhatsAppIcon size={26} />}
        {!open && teaser && <span className="chat-fab-dot" aria-hidden="true" />}
      </button>

      {open && <div className="chat-scrim" onClick={() => setOpen(false)} aria-hidden="true" />}

      {/* Rendered even while closed so it can animate; `inert` keeps its
          controls out of the tab order and the accessibility tree until then. */}
      <section
        className="chat-panel"
        data-open={open}
        inert={!open}
        role="dialog"
        aria-label="Chat with Olivia Glow"
      >
        <header className="chat-head">
          <span className="chat-avatar" aria-hidden="true">
            OG
          </span>
          <div>
            <strong>{settings.storeName}</strong>
            <small>
              <span className="chat-online" aria-hidden="true" /> Skin concierge · replies in minutes
            </small>
          </div>
          <button type="button" onClick={() => setOpen(false)} aria-label="Close the chat">
            <CloseIcon size={18} />
          </button>
        </header>

        <div className="chat-log" ref={logRef}>
          {messages.map((message) => {
            if (message.kind === "products") {
              return (
                <div className="chat-cards" key={message.id}>
                  {message.products.map((product) => (
                    <article className="chat-card" key={product.id}>
                      <img src={product.image} alt="" loading="lazy" />
                      <div>
                        <small>{product.brand}</small>
                        <h5>{product.shortName}</h5>
                        <strong>{formatLKR(product.priceLKR)}</strong>
                        <div className="chat-card-actions">
                          <button type="button" onClick={() => add(product)}>
                            Add to bag
                          </button>
                          <Link href={`/product/${product.id}`} onClick={() => setOpen(false)}>
                            Details
                          </Link>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              );
            }

            if (message.kind === "link") {
              return (
                <Link
                  className="chat-linkcard"
                  href={message.href}
                  key={message.id}
                  onClick={() => setOpen(false)}
                >
                  {message.label} →
                </Link>
              );
            }

            return (
              <div className={`chat-bubble chat-${message.kind}`} key={message.id}>
                {message.text}
                <time>{message.at}</time>
              </div>
            );
          })}

          {typing && (
            <div className="chat-bubble chat-bot chat-typing" aria-label="Typing">
              <span />
              <span />
              <span />
            </div>
          )}

          {options.length > 0 && (
            <div className="chat-quick">
              {options.map((option) => (
                <button type="button" key={option.id + option.label} onClick={() => choose(option)}>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="chat-composer" onSubmit={submit}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder={ask === "order-reference" ? "e.g. OG-1024" : "Type a message…"}
            aria-label={ask === "order-reference" ? "Order reference" : "Message"}
            enterKeyHint="send"
          />
          <button type="submit" aria-label="Send" disabled={!draft.trim() || typing}>
            <SendIcon />
          </button>
        </form>

        <button type="button" className="chat-handoff" onClick={() => handoff()}>
          <WhatsAppIcon size={16} /> Continue on WhatsApp
        </button>
      </section>
    </>
  );
}
