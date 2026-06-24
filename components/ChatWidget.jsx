"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getToken, getWsUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useSession } from "@/lib/store";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function fmtDay(iso, t) {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(today);
  yest.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return t("chat.today");
  if (d.toDateString() === yest.toDateString()) return t("chat.yesterday");
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function groupByDay(msgs, t) {
  const out = [];
  let curDay = null;
  for (const m of msgs) {
    const day = new Date(m.createdAt).toDateString();
    if (day !== curDay) { out.push({ type: "day", label: fmtDay(m.createdAt, t) }); curDay = day; }
    out.push({ type: "msg", ...m });
  }
  return out;
}

// ── ContactItem ───────────────────────────────────────────────────────────────

function ContactItem({ contact, selected, onClick, onHover }) {
  const { t } = useI18n();
  const label   = contactLabel(contact, t);
  const sub     = contactSub(contact, t);
  const timeStr = contact.lastAt ? fmtTime(contact.lastAt) : "";
  return (
    <button
      onClick={onClick}
      onMouseEnter={(e) => onHover(contact, e.currentTarget)}
      onMouseLeave={() => onHover(null, null)}
      className={`w-full flex items-center gap-2 px-2.5 py-2 transition text-left border-b border-white/5 ${
        selected ? "bg-gold-400/10 border-r-2 border-r-gold-400" : "hover:bg-white/5"
      }`}
    >
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
        contact.type === "support"
          ? "bg-gradient-to-br from-gold-300 to-gold-600"
          : "bg-white/10 border border-gold-400/20"
      }`}>
        <Icon
          name={contact.type === "support" ? "headset" : "truck"}
          size={13}
          className={contact.type === "support" ? "text-ink-900" : "text-gold-300/70"}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-1">
          <span className="text-[12px] font-semibold text-ivory truncate">{label}</span>
          {timeStr && <span className="text-[9px] text-ivory/30 shrink-0 leading-none">{timeStr}</span>}
        </div>
        <span className="text-[11px] text-ivory/50 truncate block leading-tight mt-0.5">
          {sub}
        </span>
      </div>

      {contact.unread > 0 && (
        <span className="min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 shrink-0">
          {contact.unread > 9 ? "9+" : contact.unread}
        </span>
      )}
    </button>
  );
}

// ── MessageList ───────────────────────────────────────────────────────────────

function MessageList({ msgs, loading, t, onQuickPrompt }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs.length]);

  const items = groupByDay(msgs, t);

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto p-3 space-y-2 chat-scrollbar">
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
            <div className={`h-8 rounded-2xl bg-white/5 animate-pulse ${i % 2 ? "w-24" : "w-32"}`} />
          </div>
        ))}
      </div>
    );
  }

  if (!msgs.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-11 h-11 rounded-2xl hero-accent flex items-center justify-center mb-2.5 shadow-gold">
          <Icon name="message" size={20} className="text-gold-300" />
        </div>
        <p className="text-[12px] text-ivory/50 leading-relaxed max-w-[200px]">{t("chat.vipWelcome")}</p>
        <div className="mt-3 grid grid-cols-2 gap-1.5 w-full">
          {[
            { k: "chat.promptTrackOrder", icon: "truck"   },
            { k: "chat.promptProduct",    icon: "bag"     },
            { k: "chat.promptPayment",    icon: "wallet"  },
            { k: "chat.promptReturn",     icon: "receipt" },
          ].map((q) => (
            <button key={q.k} onClick={() => onQuickPrompt(t(q.k))}
              className="card-dark flex items-center gap-1.5 p-2 rounded-lg hover:border-gold-400/40 transition text-left">
              <Icon name={q.icon} size={11} className="text-gold-300/60 shrink-0" />
              <span className="text-[10px] text-ivory/60 leading-tight">{t(q.k)}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-3 py-2 chat-scrollbar">
      <div className="space-y-1">
        {items.map((item, idx) => {
          if (item.type === "day") {
            return (
              <div key={`d${idx}`} className="flex items-center gap-2 py-1.5">
                <div className="flex-1 h-px bg-gold-400/10" />
                <span className="text-[9px] text-ivory/30 font-medium px-1">{item.label}</span>
                <div className="flex-1 h-px bg-gold-400/10" />
              </div>
            );
          }
          const isUser = item.sender === "user";
          return (
            <div key={item.id} className={`flex items-end gap-1.5 ${isUser ? "justify-end" : "justify-start"}`}>
              {!isUser && (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gold-300/70 to-gold-600/60 flex items-center justify-center shrink-0 mb-0.5">
                  <Icon name="headset" size={10} className="text-ink-900" />
                </div>
              )}
              <div className={`max-w-[76%] flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}>
                <div className={`rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                  isUser
                    ? "bg-gradient-to-br from-gold-300 to-gold-500 text-ink-900 rounded-br-sm"
                    : "bg-white/8 border border-gold-400/12 text-ivory rounded-bl-sm"
                }`}>
                  <p className="whitespace-pre-wrap break-words">{item.body}</p>
                </div>
                <span className={`text-[9px] text-ivory/25 px-0.5 ${isUser ? "text-right" : ""}`}>
                  {fmtTime(item.createdAt)}
                  {isUser && <span className="ml-1 text-gold-300/25">✓✓</span>}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} className="h-1" />
      </div>
    </div>
  );
}

// ── ContactAvatar ─────────────────────────────────────────────────────────────

function ContactAvatar({ contact, px = 28 }) {
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 ${
        contact.type === "support"
          ? "bg-gradient-to-br from-gold-300 to-gold-600"
          : "bg-white/10 border border-gold-400/20"
      }`}
      style={{ width: px, height: px }}
    >
      <Icon
        name={contact.type === "support" ? "headset" : "truck"}
        size={Math.round(px * 0.46)}
        className={contact.type === "support" ? "text-ink-900" : "text-gold-300/70"}
      />
    </div>
  );
}

function contactLabel(contact, t) {
  return contact.type === "support"
    ? t("chat.supportName")
    : `${t("chat.orderLabel")} #${contact.id.slice(-6).toUpperCase()}`;
}

function contactSub(contact, t) {
  if (contact.type === "support") return t("chat.online");
  return contact.status ? (t(`shipping.status.${contact.status}`) || contact.status) : "";
}

// ── ChatWidget (main) ─────────────────────────────────────────────────────────

export default function ChatWidget() {
  const { t }    = useI18n();
  const session  = useSession();
  const pathname = usePathname();
  const router   = useRouter();
  const toast    = useToast();

  // ── UI state ──────────────────────────────────────────────────────────────
  const [open,           setOpen]           = useState(false);
  const [mobileView,     setMobileView]     = useState("list"); // "list" | "chat" (mobile only)
  const [selectedId,     setSelectedId]     = useState(null);   // null | "support" | "shp_xxx"
  const [showContacts,   setShowContacts]   = useState(true);   // desktop sidebar toggle
  const [hoveredContact, setHoveredContact] = useState(null);   // tooltip target
  const [tooltipY,       setTooltipY]       = useState(0);      // tooltip top offset in body

  // ── Data state ────────────────────────────────────────────────────────────
  const [contacts, setContacts] = useState([
    { id: "support", type: "support", unread: 0, lastAt: null },
  ]);
  const [msgs,        setMsgs]        = useState([]);
  const [msgLoading,  setMsgLoading]  = useState(false);
  const [mounted,     setMounted]     = useState(false);

  // ── Input state ───────────────────────────────────────────────────────────
  const [text,    setText]    = useState("");
  const [sending, setSending] = useState(false);

  const TEXTAREA_MIN_H = 42;
  const TEXTAREA_MAX_H = 72;

  function autoGrow(el) {
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(Math.max(el.scrollHeight, TEXTAREA_MIN_H), TEXTAREA_MAX_H) + "px";
  }

  // Set mounted after first client render to avoid SSR/hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  // ── Refs ──────────────────────────────────────────────────────────────────
  const inputRef             = useRef(null);
  const pollerRef            = useRef(null);
  const bgPollerRef          = useRef(null);
  const bodyRef              = useRef(null);
  const prevSupportUnreadRef = useRef(0);
  const openRef              = useRef(open);
  const selectedIdRef        = useRef(selectedId);
  const wsRef                = useRef(null);
  const wsTimerRef           = useRef(null);
  const wsBackoffRef         = useRef(1000);
  const pathnameRef          = useRef(pathname);
  openRef.current            = open;
  selectedIdRef.current      = selectedId;
  pathnameRef.current        = pathname;

  // ── Helpers ───────────────────────────────────────────────────────────────

  const apiForContact     = (id) => id === "support" ? "/chat" : `/shipping/${id}/messages`;
  const postApiForContact = (id) => id === "support" ? "/chat" : `/shipping/${id}/messages`;

  // ── Load messages for selected contact ────────────────────────────────────

  const loadMsgs = useCallback(async (id) => {
    if (!id || !getToken()) return;
    try {
      const data = await api.get(apiForContact(id));
      setMsgs(data.items || []);
    } catch (_) {}
  }, []);

  // ── Unified unread poller ─────────────────────────────────────────────────
  // Fetches real unread counts from the API; also syncs order contacts.
  // Runs every 15s always, immediately on mount and on widget open.

  const pollUnread = useCallback(async () => {
    if (!getToken()) return;
    try {
      const [chatData, shippingData] = await Promise.all([
        api.get("/chat/unread").catch(() => ({ unread: 0 })),
        api.get("/shipping").catch(() => ({ items: [] })),
      ]);

      const supportUnread = Number(chatData.unread) || 0;
      const orders        = shippingData.items || [];

      setContacts((prev) => {
        // Build order lookup maps
        const orderUnreadMap = {};
        const orderStatusMap = {};
        orders.forEach((o) => {
          orderUnreadMap[o.id] = o.unreadCount || 0;
          orderStatusMap[o.id] = o.status;
        });

        // Update existing contacts' unread counts and status
        const updated = prev.map((c) => {
          if (c.id === "support") {
            if (openRef.current && selectedIdRef.current === "support") return { ...c, unread: 0 };
            return { ...c, unread: supportUnread };
          }
          if (c.type === "order") {
            const newStatus = orderStatusMap[c.id] ?? c.status;
            if (openRef.current && selectedIdRef.current === c.id) return { ...c, status: newStatus, unread: 0 };
            return { ...c, status: newStatus, unread: orderUnreadMap[c.id] ?? c.unread };
          }
          return c;
        });

        // Append new order contacts not yet in the list
        const existingIds = new Set(updated.map((c) => c.id));
        const fresh = orders
          .filter((o) => o.status !== "cancelled" && !existingIds.has(o.id))
          .map((o) => ({
            id:     o.id,
            type:   "order",
            status: o.status,
            unread: (openRef.current && selectedIdRef.current === o.id) ? 0 : (o.unreadCount || 0),
            lastAt: o.updatedAt || o.createdAt,
          }));

        return [...updated, ...fresh];
      });

      prevSupportUnreadRef.current = supportUnread;

    } catch (_) {}
  }, []);

  // 60s fallback poller — catches missed events when WS is disconnected
  useEffect(() => {
    pollUnread();
    bgPollerRef.current = setInterval(pollUnread, 60_000);
    return () => clearInterval(bgPollerRef.current);
  }, [pollUnread]);

  // ── WebSocket — real-time push from backend ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    function connect() {
      if (cancelled) return;
      const token = getToken();
      const url   = getWsUrl();
      if (!token || !url) return;
      if (wsRef.current?.readyState <= 1) return; // already open/connecting

      let ws;
      try { ws = new WebSocket(`${url}?token=${encodeURIComponent(token)}`); }
      catch { return; }
      wsRef.current = ws;

      ws.onopen = () => { wsBackoffRef.current = 1000; };

      ws.onmessage = (evt) => {
        let d;
        try { d = JSON.parse(evt.data); } catch { return; }

        if (d.type === "notification") {
          window.dispatchEvent(new CustomEvent("notifUpdated"));
          if (d.notification?.title) toast.info(d.notification.title);
          return;
        }
        if (d.type !== "chat") return;

        if (d.subtype === "support") {
          const isViewing = openRef.current && selectedIdRef.current === "support";
          setContacts((prev) => prev.map((c) =>
            c.id === "support"
              ? { ...c, unread: isViewing ? 0 : (d.unread ?? c.unread), lastAt: new Date().toISOString() }
              : c
          ));
          if (isViewing) {
            loadMsgs("support");
          }
          prevSupportUnreadRef.current = d.unread ?? 0;

        } else if (d.subtype === "shipping" && d.orderId) {
          // Ignore WS events for user-sent messages — those are merchant-destined
          // notifications carrying the merchant's unread count, not the user's.
          if (d.message?.sender === "user") return;
          const isViewing = openRef.current && selectedIdRef.current === d.orderId;
          setContacts((prev) => prev.map((c) =>
            c.id === d.orderId
              ? { ...c, unread: isViewing ? 0 : (d.unread ?? c.unread), lastAt: new Date().toISOString() }
              : c
          ));
          if (isViewing) loadMsgs(d.orderId);
        }
      };

      ws.onclose = (ev) => {
        wsRef.current = null;
        if (cancelled || ev.code === 4001) return;
        wsTimerRef.current = setTimeout(() => {
          wsBackoffRef.current = Math.min(wsBackoffRef.current * 2, 30_000);
          connect();
        }, wsBackoffRef.current);
      };

      ws.onerror = () => { try { ws.close(); } catch (_) {} };
    }

    connect();
    return () => {
      cancelled = true;
      clearTimeout(wsTimerRef.current);
      try { wsRef.current?.close(1000, "unmount"); } catch (_) {}
      wsRef.current = null;
    };
  }, [loadMsgs]);

  // ── Active poller (runs when widget is open and a contact is selected) ────

  useEffect(() => {
    clearInterval(pollerRef.current);
    if (!open || !selectedId) return;

    const poll = () => loadMsgs(selectedId);
    poll();
    pollerRef.current = setInterval(poll, 4_000);
    return () => clearInterval(pollerRef.current);
  }, [open, selectedId, loadMsgs]);

  // ── Open/close ────────────────────────────────────────────────────────────

  const openWidget = useCallback(() => {
    setOpen(true);
    pollUnread(); // sync contacts + unread counts immediately on open
    if (!selectedId) {
      setSelectedId("support");
      setMobileView("chat");
    }
  }, [pollUnread, selectedId]);

  const closeWidget = useCallback(() => {
    setOpen(false);
    setMobileView("list");
  }, []);

  // ── Select a contact ──────────────────────────────────────────────────────

  const selectContact = useCallback((id) => {
    setSelectedId(id);
    setMobileView("chat");
    setMsgLoading(true);
    setMsgs([]);

    setContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, unread: 0 } : c))
    );

    loadMsgs(id).finally(() => setMsgLoading(false));
  }, [loadMsgs]);

  // ── Tooltip handler ───────────────────────────────────────────────────────

  const onContactHover = useCallback((contact, el) => {
    if (!contact || !el || !bodyRef.current) {
      setHoveredContact(null);
      return;
    }
    const bodyRect    = bodyRef.current.getBoundingClientRect();
    const elRect      = el.getBoundingClientRect();
    const TOOLTIP_H   = 140;
    const rawY        = elRect.top - bodyRect.top;
    const clampedY    = Math.min(rawY, bodyRect.height - TOOLTIP_H);
    setHoveredContact(contact);
    setTooltipY(Math.max(0, clampedY));
  }, []);

  // ── Send message ──────────────────────────────────────────────────────────

  const send = useCallback(async () => {
    const body = text.trim();
    if (!body || sending || !selectedId) return;
    setSending(true);
    setText("");
    requestAnimationFrame(() => autoGrow(inputRef.current));
    try {
      const msg = await api.post(postApiForContact(selectedId), { body });
      setMsgs((prev) => [...prev, msg]);
    } catch {
      setText(body);
      requestAnimationFrame(() => autoGrow(inputRef.current));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }, [text, sending, selectedId]);

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  // ── Total unread for floating badge ───────────────────────────────────────

  const totalUnread = contacts.reduce((s, c) => s + (c.unread || 0), 0);

  if (!mounted) return null;
  if (pathname === "/service/chat") return null;
  if (!session && !getToken()) return null;

  // ── Render ────────────────────────────────────────────────────────────────

  const selectedContact = contacts.find((c) => c.id === selectedId) ?? null;

  return (
    <>
      {/* ── Floating button ─────────────────────────────────────────────── */}
      <button
        onClick={open ? closeWidget : openWidget}
        className={`fixed ${pathname?.startsWith("/product/") ? "bottom-[224px]" : "bottom-[148px]"} right-4 lg:bottom-6 lg:right-6 z-[45] rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-gold flex items-center justify-center transition-all hover:scale-110 active:scale-95`}
        style={{ width: 52, height: 52 }}
        aria-label={t("chat.widgetTitle")}
      >
        <Icon name={open ? "close" : "message"} size={22} />
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1 shadow-md">
            {totalUnread > 9 ? "9+" : totalUnread}
          </span>
        )}
      </button>

      {/* ── Popup ───────────────────────────────────────────────────────── */}
      <div
        className={`fixed z-[55] flex flex-col overflow-hidden
          inset-0
          md:inset-auto md:bottom-44 md:right-4
          lg:bottom-24 lg:right-6
          md:h-[540px] md:rounded-2xl md:shadow-2xl
          bg-[#1a150d] border border-gold-400/15
          transition-all duration-300 ease-out
          ${showContacts ? "md:w-[480px]" : "md:w-[300px]"}
          ${open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
          }`}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="shrink-0 flex items-center gap-2 px-3 py-3 border-b border-gold-400/15 bg-[#1a150d]">

          {/* Back button — mobile only, when in chat view */}
          {mobileView === "chat" && (
            <button
              onClick={() => setMobileView("list")}
              className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-ivory/70 hover:text-ivory md:hidden shrink-0 transition"
            >
              <Icon name="chevronLeft" size={18} />
            </button>
          )}

          {/* Sidebar toggle — desktop only */}
          <button
            onClick={() => setShowContacts((v) => !v)}
            title={showContacts ? "Hide contacts" : "Show contacts"}
            className={`hidden md:flex w-8 h-8 rounded-lg items-center justify-center shrink-0 transition ${
              showContacts
                ? "bg-gold-400/15 text-gold-300 hover:bg-gold-400/25"
                : "bg-white/6 text-ivory/40 hover:text-ivory/70"
            }`}
          >
            <Icon name="panelLeft" size={15} />
          </button>

          {/* Title area */}
          <div className="flex-1 min-w-0 flex items-center">
            {selectedContact ? (
              <button
                onClick={() => {
                  const href = selectedContact.type === "support"
                    ? "/service/chat"
                    : `/shipping/${selectedContact.id}`;
                  closeWidget();
                  router.push(href);
                }}
                className="flex items-center gap-2 group min-w-0"
              >
                <ContactAvatar contact={selectedContact} px={28} />
                <div className="text-left min-w-0">
                  <p className="text-[13px] font-semibold text-ivory leading-none group-hover:text-gold-300 transition truncate">
                    {contactLabel(selectedContact, t)}
                  </p>
                  {selectedContact.type === "support" ? (
                    <p className="text-[10px] text-emerald-400 mt-0.5 leading-none">{t("chat.online")}</p>
                  ) : (
                    <p className="text-[10px] text-ivory/40 mt-0.5 leading-none truncate">{contactSub(selectedContact, t)}</p>
                  )}
                </div>
                <Icon name="chevronRight" size={13} className="text-ivory/20 group-hover:text-gold-300/50 transition shrink-0 ml-0.5" />
              </button>
            ) : (
              <p className="text-[14px] font-semibold text-ivory">{t("chat.widgetTitle")}</p>
            )}
          </div>

          {/* Close */}
          <button
            onClick={closeWidget}
            className="w-8 h-8 rounded-full bg-white/8 flex items-center justify-center text-ivory/60 hover:text-ivory transition shrink-0"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <div ref={bodyRef} className="flex flex-1 min-h-0 relative">

          {/* Contact list panel */}
          <div className={`flex flex-col border-r border-gold-400/10 overflow-y-auto chat-scrollbar shrink-0 transition-all duration-200
            ${mobileView === "chat" ? "hidden" : "flex"}
            ${showContacts ? "md:flex md:w-[180px]" : "md:hidden"}
            w-full`}
          >
            {contacts.map((c) => (
              <ContactItem
                key={c.id}
                contact={c}
                selected={c.id === selectedId}
                onClick={() => selectContact(c.id)}
                onHover={onContactHover}
              />
            ))}

            {contacts.length === 1 && (
              <div className="p-3 mt-2">
                <p className="text-[10px] text-ivory/25 leading-relaxed">{t("chat.orderChat")}</p>
                <p className="text-[10px] text-ivory/20 mt-0.5">{t("shipping.empty")}</p>
              </div>
            )}
          </div>

          {/* Tooltip — appears to the right of the contact panel (desktop only) */}
          {hoveredContact && showContacts && (
            <div
              className="hidden md:block absolute z-20 pointer-events-none"
              style={{ left: 188, top: tooltipY }}
            >
              <div className="bg-[#1e1a10] border border-gold-400/25 rounded-xl shadow-lux p-3 w-52">
                <div className="flex items-center gap-2 mb-1.5">
                  <ContactAvatar contact={hoveredContact} px={24} />
                  <p className="text-[12px] font-semibold text-ivory leading-tight">{contactLabel(hoveredContact, t)}</p>
                </div>
                {contactSub(hoveredContact, t) && (
                  <p className="text-[11px] text-ivory/50 leading-relaxed">{contactSub(hoveredContact, t)}</p>
                )}
                {hoveredContact.unread > 0 && (
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    <p className="text-[10px] text-red-400">{hoveredContact.unread} unread</p>
                  </div>
                )}
                {hoveredContact.lastAt && (
                  <p className="text-[10px] text-ivory/25 mt-1.5">{fmtTime(hoveredContact.lastAt)}</p>
                )}
              </div>
            </div>
          )}

          {/* Chat panel */}
          <div className={`flex flex-col flex-1 min-w-0 min-h-0
            ${mobileView === "list" ? "hidden md:flex" : "flex"}`}
          >
            {selectedId ? (
              <>
                <MessageList
                  msgs={msgs}
                  loading={msgLoading}
                  t={t}
                  onQuickPrompt={(txt) => { setText(txt); inputRef.current?.focus(); }}
                />

                {/* Input bar */}
                <div className="shrink-0 border-t border-gold-400/15 px-3 py-2.5 bg-[#1a150d]">
                  <div className="flex items-end gap-2">
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
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        text.trim()
                          ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-gold"
                          : "bg-white/6 text-ivory/25"
                      } disabled:opacity-60`}
                    >
                      <Icon name="send" size={17} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 rounded-2xl hero-accent flex items-center justify-center mb-3 shadow-gold">
                  <Icon name="message" size={22} className="text-gold-300" />
                </div>
                <p className="text-[12px] text-ivory/40 leading-relaxed">{t("chat.widgetSelectHint")}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
