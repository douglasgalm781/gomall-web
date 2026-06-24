"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { api, getToken } from "@/lib/api";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";

// ── Step tracker config ────────────────────────────────────────────────────
const STEPS = [
  { key: "pending",    icon: "bag",        labelKey: "shipping.step.pending"        },
  { key: "processing", icon: "clock",       labelKey: "shipping.status.processing"   },
  { key: "shipped",    icon: "truck",       labelKey: "shipping.status.shipped"      },
  { key: "delivered",  icon: "checkCircle", labelKey: "shipping.status.delivered"    },
];

function stepIndex(status) {
  return STEPS.findIndex((s) => s.key === status);
}

function StepTracker({ status, createdAt, updatedAt, t }) {
  const cancelled = status === "cancelled";
  const current   = cancelled ? -1 : stepIndex(status);

  return (
    <div className="card-dark p-5 md:p-7">
      {/* Step row: circle · line · circle · line … */}
      <div className="flex items-start">
        {STEPS.map((step, i) => {
          const done    = !cancelled && i <  current;
          const active  = !cancelled && i === current;
          const isLast  = i === STEPS.length - 1;
          const lineGold = !cancelled && i < current; // line after this step is gold

          return (
            <div key={step.key} className="flex items-start flex-1 last:flex-none">
              {/* Circle + label */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  done   ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-sm" :
                  active ? "bg-gold-400/15 text-gold-300 ring-1 ring-gold-400/50" :
                           "bg-white/6 text-ivory/20"
                }`}>
                  <Icon
                    name={done ? "check" : step.icon}
                    size={18}
                    strokeWidth={done || active ? 2 : 1.5}
                  />
                </div>
                <div className="text-center w-16">
                  <p className={`text-[10px] font-semibold leading-tight ${
                    done || active ? "text-ivory/80" : "text-ivory/25"
                  }`}>
                    {t(step.labelKey)}
                  </p>
                  {(done || active) && (
                    <p className="text-[9px] text-ivory/35 mt-0.5">
                      {new Date(i === 0 ? createdAt : updatedAt).toLocaleDateString(
                        undefined, { month: "short", day: "numeric" }
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Connector line (between circles, not after the last) */}
              {!isLast && (
                <div className="flex-1 h-[3px] mt-[22px] mx-1 rounded-full overflow-hidden bg-white/12">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: lineGold ? "100%" : "0%",
                      background: "linear-gradient(to right, #c79a3c, #d8b76a)",
                      boxShadow: lineGold ? "0 0 6px rgba(199,154,60,0.45)" : "none",
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status label */}
      <p className="text-center text-[12px] mt-5">
        {cancelled
          ? <span className="text-red-400 font-semibold">{t("shipping.orderCancelled")}</span>
          : current < STEPS.length - 1
          ? <span className="text-ivory/40">{t("shipping.nextStep")} <span className="text-gold-300/70">{t(STEPS[current + 1]?.labelKey)}</span></span>
          : <span className="text-emerald-400">{t("shipping.deliveredMsg")}</span>
        }
      </p>
    </div>
  );
}

// ── Chat helpers ────────────────────────────────────────────────────────────
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

// ── Message bubble ──────────────────────────────────────────────────────────
function Bubble({ item, t }) {
  if (item.type === "day") {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 h-px bg-gold-400/10" />
        <span className="text-[10px] text-ivory/30 font-medium px-2">{item.label}</span>
        <div className="flex-1 h-px bg-gold-400/10" />
      </div>
    );
  }

  const isUser     = item.sender === "user";
  const isMerchant = item.sender === "merchant";
  const avatarIcon = isMerchant ? "store" : "headset";
  const senderName = isMerchant ? t("shipping.merchantName") : t("chat.supportName");

  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-gold-300/70 to-gold-600/60 flex items-center justify-center shrink-0 mb-0.5">
          <Icon name={avatarIcon} size={12} className="text-ink-900" />
        </div>
      )}
      <div className={`max-w-[72%] flex flex-col gap-0.5 ${isUser ? "items-end" : "items-start"}`}>
        {!isUser && (
          <span className="text-[10px] font-semibold text-gold-300/70 ml-1">{senderName}</span>
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
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function ShippingDetailPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { t }    = useI18n();
  const { fmt }  = useCurrency();

  const [order,    setOrder]    = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [text,     setText]     = useState("");
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

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

  useEffect(() => {
    api.get(`/shipping/${id}`).then(setOrder).catch(() => {});
  }, [id]);

  useEffect(() => {
    function load() {
      api
        .get(`/shipping/${id}/messages`)
        .then((data) => setMessages(data.items || []))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    load();
    const timer = setInterval(load, 4000);
    return () => clearInterval(timer);
  }, [id]);

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
      const msg = await api.post(`/shipping/${id}/messages`, { body });
      setMessages((prev) => [...prev, msg]);
    } catch {
      setText(body);
      requestAnimationFrame(() => autoGrow(inputRef.current));
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  }

  return (
    <div className="luxe min-h-screen pb-4">

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 glass-dark border-b border-gold-400/15">
        <div className="max-w-3xl mx-auto px-4 md:px-8 h-14 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full gold-hairline bg-white/5 text-ivory/70 flex items-center justify-center shrink-0"
          >
            <Icon name="chevronLeft" size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-ivory/40 tracking-widest uppercase">{t("profile.overview.activityShipment")}</p>
            <p className="text-[13px] font-semibold text-ivory truncate">#{id}</p>
          </div>
          {order && (
            <span className={`pill text-[11px] shrink-0 ${
              order.status === "delivered" ? "pill-success" :
              order.status === "cancelled" ? "pill-danger"  :
              order.status === "shipped"   ? "pill-info"    : "pill-warning"
            }`}>
              {t(`shipping.status.${order.status}`)}
            </span>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-8 pt-5 space-y-4">

        {/* ── Order # + package label ──────────────────────────────────────── */}
        {order && (
          <div className="text-center">
            <h1 className="serif text-[22px] font-bold text-ivory">{t("shipping.orderNumber")} #{id.replace("shp_", "")}</h1>
            <p className="text-[12px] text-ivory/40 mt-1">
              {t("shipping.packageOf").replace("{n}", 1).replace("{total}", 1)} · {t("shipping.placedOn")} {new Date(order.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
            </p>
          </div>
        )}

        {/* ── Step tracker ─────────────────────────────────────────────────── */}
        {order && (
          <StepTracker
            status={order.status}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            t={t}
          />
        )}

        {/* ── Shipping Address ─────────────────────────────────────────────── */}
        {order?.shippingAddress?.addressLine1 && (
          <div className="card-dark p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-gold-400/12 flex items-center justify-center">
                <Icon name="mapPin" size={14} className="text-gold-300" />
              </div>
              <p className="text-[11px] font-semibold text-ivory/45 uppercase tracking-[0.2em]">{t("cart.deliveryAddress")}</p>
            </div>
            <div className="space-y-0.5 pl-9">
              {order.shippingAddress.name && (
                <p className="text-[14px] font-semibold text-ivory">{order.shippingAddress.name}</p>
              )}
              {order.shippingAddress.phone && (
                <p className="text-[12px] text-ivory/50">{order.shippingAddress.phone}</p>
              )}
              <p className="text-[13px] text-ivory/75 leading-relaxed pt-1">
                {order.shippingAddress.addressLine1}
                {order.shippingAddress.addressLine2 && <>, {order.shippingAddress.addressLine2}</>}
                <br />
                {[order.shippingAddress.city, order.shippingAddress.state].filter(Boolean).join(", ")}
                {order.shippingAddress.postalCode && <> {order.shippingAddress.postalCode}</>}
                {order.shippingAddress.country && <><br />{order.shippingAddress.country}</>}
              </p>
            </div>
          </div>
        )}

        {/* ── Package Contents ─────────────────────────────────────────────── */}
        {order && (
          <div className="card-dark p-4 space-y-1">
            <p className="text-[11px] font-semibold text-ivory/45 uppercase tracking-[0.2em] mb-3">
              {t("shipping.packageContents")}
            </p>
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 py-2 border-b border-gold-400/8 last:border-0">
                <LuxImage
                  src={item.snapshot.image}
                  alt={item.snapshot.brand}
                  className="w-12 h-12 rounded-lg shrink-0 gold-hairline"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-gold-300/75 text-[9px] tracking-[0.2em] uppercase">{item.snapshot.brand}</p>
                  <p className="text-[12px] text-ivory/85 leading-snug line-clamp-2 mt-0.5">{item.snapshot.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] text-ivory/45">× {item.qty}</span>
                    <span className="text-[12px] font-semibold gold-text tracking-tight">{fmt(item.lineTotal)}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-[13px]">
              <span className="text-ivory/50">{t("shipping.total")}</span>
              <span className="font-bold gold-text tracking-tight">{fmtNative(order.payAmount || order.total, order.payCurrency || 'USD')}</span>
            </div>

            {/* Admin note */}
            {order.adminNote && (
              <div className="mt-3 rounded-xl bg-white/5 gold-hairline p-3">
                <p className="text-[10px] font-semibold text-gold-300 mb-1 uppercase tracking-widest">
                  {t("shipping.updateFromSupport")}
                </p>
                <p className="text-[12px] text-ivory/75 leading-relaxed whitespace-pre-wrap">{order.adminNote}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Chat section ─────────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-gold-400/10">
          <p className="text-[11px] font-semibold text-ivory/40 uppercase tracking-[0.2em] mb-4">
            {t("shipping.orderSupportChat")}
          </p>

          {loading ? (
            <div className="text-center text-ivory/35 text-[13px] py-8">{t("common.loading")}</div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Icon name="message" size={32} className="text-gold-300/20 mb-3" />
              <p className="text-[13px] text-ivory/40">{t("shipping.noMessages")}</p>
              <p className="text-[12px] text-ivory/25 mt-1">{t("shipping.noMessagesHint")}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {groupByDay(messages, t).map((item, idx) => (
                <Bubble key={item.id ?? `day-${idx}`} item={item} t={t} />
              ))}
            </div>
          )}

          {/* Spacer for fixed input */}
          <div className="h-24" ref={bottomRef} />
        </div>
      </div>

      {/* ── Fixed chat input ────────────────────────────────────────────────── */}
      <div className="fixed bottom-0 inset-x-0 px-4 py-3 glass-dark border-t border-gold-400/15 z-30">
        <div className="flex items-end gap-2 max-w-3xl mx-auto">
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            onChange={(e) => { setText(e.target.value); autoGrow(e.target); }}
            onKeyDown={onKeyDown}
            placeholder={t("shipping.chatPlaceholder")}
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
