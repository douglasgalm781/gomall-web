"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { api, getToken } from "@/lib/api";
import Icon from "@/components/Icon";

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDay(iso, t) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("chat.today");
  if (d.toDateString() === yesterday.toDateString()) return t("chat.yesterday");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDay(messages, t) {
  const groups = [];
  let currentDay = null;
  for (const m of messages) {
    const day = new Date(m.createdAt).toDateString();
    if (day !== currentDay) { groups.push({ type: "day", label: formatDay(m.createdAt, t) }); currentDay = day; }
    groups.push({ type: "msg", ...m });
  }
  return groups;
}

export default function ChatPage() {
  const router = useRouter();
  const { t }  = useI18n();
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  const TEXTAREA_MIN_H = 42;
  const TEXTAREA_MAX_H = 72;

  function autoGrow(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight, TEXTAREA_MIN_H), TEXTAREA_MAX_H) + "px";
  }

  useEffect(() => {
    if (typeof window !== "undefined" && !getToken()) router.replace("/login");
  }, [router]);

  // Lock body scroll so only the inner messages panel scrolls
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    function load() {
      api.get("/chat").then((d) => setMessages(d.items || [])).catch(() => {}).finally(() => setLoading(false));
    }
    load();
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    requestAnimationFrame(() => autoGrow(inputRef.current));
    try {
      const msg = await api.post("/chat", { body });
      setMessages((prev) => [...prev, msg]);
    } catch {
      setText(body);
      requestAnimationFrame(() => autoGrow(inputRef.current));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const items = groupByDay(messages, t);

  return (
    <div className="luxe flex flex-col" style={{ height: "100dvh" }}>

      {/* ── Chat header ─────────────────────────────────────────────── */}
      <div className="shrink-0 bg-[#1a150d] border-b border-gold-400/20 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full gold-hairline bg-white/8 text-ivory flex items-center justify-center shrink-0"
        >
          <Icon name="chevronLeft" size={20} />
        </button>

        {/* Agent avatar */}
        <div className="relative shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center">
            <Icon name="headset" size={18} className="text-ink-900" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#1a150d]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[14px] font-semibold text-ivory leading-none">{t("chat.supportName")}</p>
          <p className="text-[11px] text-emerald-400 mt-0.5">{t("chat.online")}</p>
        </div>
      </div>

      {/* ── Messages area ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-4">
      <div className="max-w-2xl mx-auto space-y-1">

        {loading ? (
          <div className="flex flex-col items-center pt-16 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"} w-full`}>
                <div className={`h-10 rounded-2xl bg-white/5 animate-pulse ${i % 2 === 0 ? "w-48" : "w-40"}`} />
              </div>
            ))}
          </div>
        ) : messages.length === 0 ? (
          /* ── Empty / welcome state ── */
          <div className="flex flex-col items-center text-center pt-10 pb-6">
            <div className="w-20 h-20 rounded-3xl hero-accent flex items-center justify-center shadow-gold mb-4">
              <Icon name="headset" size={32} className="text-gold-300" />
            </div>
            <h3 className="serif text-[18px] font-bold text-ivory">{t("chat.vipTitle")}</h3>
            <p className="text-[13px] text-ivory/50 mt-2 max-w-[260px] leading-relaxed">
              {t("chat.vipWelcome")}
            </p>

            {/* Quick prompts */}
            <div className="mt-5 grid grid-cols-2 gap-2 w-full max-w-xs">
              {[
                { labelKey: "chat.promptTrackOrder", icon: "truck"    },
                { labelKey: "chat.promptProduct",    icon: "bag"      },
                { labelKey: "chat.promptPayment",    icon: "wallet"   },
                { labelKey: "chat.promptReturn",     icon: "receipt"  },
              ].map((q) => (
                <button key={q.labelKey} onClick={() => { setText(t(q.labelKey)); inputRef.current?.focus(); }}
                  className="card-dark flex flex-col items-center gap-2 p-3 rounded-xl hover:border-gold-400/50 transition text-left">
                  <Icon name={q.icon} size={16} className="text-gold-300/70" />
                  <span className="text-[11px] text-ivory/70 leading-tight text-center">{t(q.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          items.map((item, idx) => {
            if (item.type === "day") {
              return (
                <div key={`day-${idx}`} className="flex items-center gap-3 py-2">
                  <div className="flex-1 h-px bg-gold-400/10" />
                  <span className="text-[10px] text-ivory/30 font-medium px-2">{item.label}</span>
                  <div className="flex-1 h-px bg-gold-400/10" />
                </div>
              );
            }

            const isUser = item.sender === "user";
            return (
              <div key={item.id} className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>

                {/* Admin avatar */}
                {!isUser && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-300/70 to-gold-600/60 flex items-center justify-center shrink-0 mb-0.5">
                    <Icon name="headset" size={12} className="text-ink-900" />
                  </div>
                )}

                <div className={`max-w-[72%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
                  {/* Sender label for admin */}
                  {!isUser && (
                    <span className="text-[10px] font-semibold text-gold-300/70 ml-1">{t("chat.supportName")}</span>
                  )}

                  <div className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed ${
                    isUser
                      ? "bg-gradient-to-br from-gold-300 to-gold-500 text-ink-900 rounded-br-md"
                      : "bg-white/8 border border-gold-400/12 text-ivory rounded-bl-md"
                  }`}>
                    <p className="whitespace-pre-wrap break-words">{item.body}</p>
                  </div>

                  <span className={`text-[10px] text-ivory/30 px-1 ${isUser ? "text-right" : "text-left"}`}>
                    {formatTime(item.createdAt)}
                    {isUser && <span className="ml-1 text-gold-300/40">✓✓</span>}
                  </span>
                </div>
              </div>
            );
          })
        )}

        <div ref={bottomRef} className="h-1" />
      </div>
      </div>

      {/* ── Input bar ────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-[#1a150d] border-t border-gold-400/20 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-end gap-3 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => { setText(e.target.value); autoGrow(e.target); }}
            onKeyDown={onKeyDown}
            placeholder={t("chat.placeholder")}
            className="flex-1 bg-[#1c1610] border border-gold-400/20 rounded-xl px-3 py-2 text-[13px] text-ivory placeholder-ivory/35 outline-none focus:border-gold-400/45 transition resize-none leading-relaxed overflow-y-auto input-scrollbar"
            style={{ height: `${TEXTAREA_MIN_H}px` }}
          />
          <button
            onClick={send}
            disabled={sending || !text.trim()}
            className="shrink-0 text-gold-400/60 hover:text-gold-300 hover:drop-shadow-[0_0_6px_rgba(212,175,55,0.7)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 active:scale-90 p-1"
          >
            <Icon name="send" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
}
