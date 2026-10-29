"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatProduct, ChatReply } from "@/lib/shop-assistant";
import styles from "./shopping-assistant.module.css";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ChatProduct[];
  actions?: ChatReply["actions"];
};

const welcome: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I’m Pick! Tell me what you’re looking for or give me a budget. I can help you find a product, check its details, or track an order.",
};
const starters = [
  "Show me smartwatches",
  "What can I get under ₦10,000?",
  "Help me choose a product",
  "How do I track my order?",
];
const money = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});

function ChatIcon({ close = false }: { close?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {close ? (
        <path d="m6 6 12 12M18 6 6 18" />
      ) : (
        <path d="M20 11.5a8 8 0 0 1-8 8H5l-3 2v-10a9 9 0 0 1 18 0ZM7.5 11h.01M12 11h.01M16.5 11h.01" />
      )}
    </svg>
  );
}

function ProductCard({ product }: { product: ChatProduct }) {
  return (
    <Link href={product.href} className={styles.product}>
      <span className={styles.thumbnail}>
        {product.image ? (
          <Image src={product.image} alt="" width={56} height={64} unoptimized />
        ) : (
          <span aria-hidden="true">RP</span>
        )}
      </span>
      <span className={styles.productInfo}>
        <strong>{product.name}</strong>
        <span className={styles.price}>{money.format(product.price)}</span>
        <span className={styles.stock}>
          {product.stock > 0 ? "In stock" : "Out of stock"}
          {product.colors.length > 0 ? ` · ${product.colors.join(", ")}` : ""}
        </span>
      </span>
      <span className={styles.productArrow} aria-hidden="true">↗</span>
    </Link>
  );
}

function ChatWidget({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([welcome]);
  const [suggestions, setSuggestions] = useState(starters);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<{ text: string; prompt: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const sendingRef = useRef(false);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (open && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, loading, failure, open]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  function closeChat() {
    setOpen(false);
    launcherRef.current?.focus();
  }

  async function sendMessage(value: string, retry = false) {
    const text = value.trim();
    if (!text || text.length > 600 || sendingRef.current) return;

    sendingRef.current = true;
    setLoading(true);
    setFailure(null);
    setInput("");
    if (!retry) {
      setMessages((current) => [
        ...current.slice(-39),
        { id: crypto.randomUUID(), role: "user", content: text },
      ]);
    }

    const history = messages
      .filter((message) => message.id !== "welcome")
      .slice(0, retry ? -1 : undefined)
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));
    const routeProductId = pathname.match(/^\/(?:product|order)\/(\d+)\/?$/)?.[1];
    const controller = new AbortController();
    controllerRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 25000);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history,
          ...(routeProductId ? { productId: Number(routeProductId) } : {}),
        }),
        signal: controller.signal,
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "I couldn’t check that right now. Please try again.");
      }
      if (
        typeof data.reply !== "string" ||
        !Array.isArray(data.products) ||
        !Array.isArray(data.actions) ||
        !Array.isArray(data.suggestions)
      ) {
        throw new Error("I couldn’t read that response. Please try again.");
      }
      const answer = data as ChatReply;
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: answer.reply,
          products: answer.products,
          actions: answer.actions,
        },
      ]);
      setSuggestions(answer.suggestions);
    } catch (error) {
      setFailure({
        text: controller.signal.aborted
          ? "That took longer than expected. Please try again."
          : error instanceof Error
            ? error.message
            : "I couldn’t connect. Please try again.",
        prompt: text,
      });
    } finally {
      window.clearTimeout(timeout);
      controllerRef.current = null;
      sendingRef.current = false;
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(input);
  }

  function resetChat() {
    if (sendingRef.current) return;
    setMessages([welcome]);
    setSuggestions(starters);
    setFailure(null);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className={styles.widget}>
      {open && (
        <section
          id="shopping-assistant"
          role="dialog"
          aria-labelledby="shopping-assistant-title"
          className={styles.panel}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.stopPropagation();
              closeChat();
            }
          }}
        >
          <header className={styles.header}>
            <span className={styles.avatar}>
              <Image src="/rplogo.png" width={42} height={42} alt="" />
            </span>
            <div className={styles.heading}>
              <h2 id="shopping-assistant-title">Meet Pick <span>✦</span></h2>
              <p>Your Random Picks NG assistant</p>
            </div>
            <button
              type="button"
              className={styles.iconButton}
              aria-label="Clear conversation"
              title="Clear conversation"
              disabled={loading}
              onClick={resetChat}
            >
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M3 10a9 9 0 1 1 2.5 8.2M3 4v6h6" />
              </svg>
            </button>
            <button type="button" className={styles.iconButton} aria-label="Close chat" onClick={closeChat}>
              <ChatIcon close />
            </button>
          </header>

          <div ref={logRef} className={styles.log} role="log" aria-live="polite" aria-relevant="additions" aria-label="Conversation">
            <p className={styles.intro}>A LITTLE HELP. A GREAT PICK.</p>
            {messages.map((message) => (
              <div key={message.id} className={message.role === "user" ? styles.userRow : styles.assistantRow}>
                <span className={styles.speaker}>{message.role === "user" ? "You" : "Pick"}</span>
                <div className={styles.bubble}>{message.content}</div>
                {message.products && message.products.length > 0 && (
                  <div className={styles.products}>
                    {message.products.map((product) => <ProductCard key={product.id} product={product} />)}
                  </div>
                )}
                {message.actions && message.actions.length > 0 && (
                  <div className={styles.actions}>
                    {message.actions.map((action) => (
                      <a key={action.href} href={action.href}>{action.label}<span aria-hidden="true"> ↗</span></a>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <p className={styles.loading} role="status"><span /> Checking the store…</p>}
            {failure && (
              <div className={styles.error} role="alert">
                <p>{failure.text}</p>
                <button type="button" onClick={() => void sendMessage(failure.prompt, true)} disabled={loading}>Try again ↗</button>
              </div>
            )}
          </div>

          <div className={styles.bottom}>
            {suggestions.length > 0 && !failure && (
              <div className={styles.suggestions} aria-label="Suggested questions">
                {suggestions.map((suggestion) => (
                  <button key={suggestion} type="button" disabled={loading} onClick={() => void sendMessage(suggestion)}>{suggestion}</button>
                ))}
              </div>
            )}
            <form className={styles.composer} onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="What are you looking for?"
                aria-label="Your message"
                maxLength={600}
                autoComplete="off"
                enterKeyHint="send"
              />
              <button type="submit" aria-label="Send message" disabled={loading || !input.trim()}>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 7-7 7 7M12 5v15" /></svg>
              </button>
            </form>
            <p className={styles.footer}>Good questions. Better picks.</p>
          </div>
        </section>
      )}
      <button
        ref={launcherRef}
        type="button"
        className={styles.launcher}
        aria-label={open ? "Close shopping assistant" : "Open shopping assistant"}
        aria-expanded={open}
        aria-controls={open ? "shopping-assistant" : undefined}
        onClick={() => open ? closeChat() : setOpen(true)}
      >
        <ChatIcon close={open} />
        <span>{open ? "Close chat" : "Ask Pick"}</span>
        {!open && <span className={styles.launcherSparkle} aria-hidden="true">✦</span>}
      </button>
    </div>
  );
}

export default function ShoppingAssistant() {
  const pathname = usePathname();
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return null;
  return <ChatWidget pathname={pathname} />;
}
