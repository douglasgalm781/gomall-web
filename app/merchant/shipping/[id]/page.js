"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import Icon from "@/components/Icon";
import { useToast } from "@/components/Toast";
import { useI18n } from "@/lib/i18n";

const STATUSES = ["pending","processing","shipped","delivered","cancelled"];

function money(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function MerchantShippingDetail() {
  const { t }  = useI18n();
  const { id } = useParams();
  const toast  = useToast();

  const [order,        setOrder]        = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [messages,     setMessages]     = useState([]);
  const [loadingMsgs,  setLoadingMsgs]  = useState(true);
  const [text,         setText]         = useState("");
  const [sending,      setSending]      = useState(false);
  const [status,       setStatus]       = useState("");
  const [merchantNote, setMerchantNote] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);
  const [savedStatus,  setSavedStatus]  = useState(false);
  const chatRef   = useRef(null);

  useEffect(() => {
    api.get(`/merchant/shipping/${id}`)
      .then((d) => { setOrder(d); setStatus(d.status); setMerchantNote(d.merchantNote || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    function loadMessages() {
      api.get(`/merchant/shipping/${id}/messages`)
        .then((d) => setMessages(d.items || []))
        .catch(() => {})
        .finally(() => setLoadingMsgs(false));
    }
    loadMessages();
    const t = setInterval(loadMessages, 4000);
    return () => clearInterval(t);
  }, [id]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages.length]);

  async function handleStatusSave() {
    setSavingStatus(true);
    try {
      const updated = await api.patch(`/merchant/shipping/${id}`, { status, merchantNote });
      setOrder(updated);
      setMerchantNote(updated.merchantNote || "");
      setSavedStatus(true);
      setTimeout(() => setSavedStatus(false), 2000);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("merchant.shippingDetail.updateFailed"));
    } finally {
      setSavingStatus(false);
    }
  }

  async function sendMessage() {
    const body = text.trim();
    if (!body || sending) return;
    setSending(true);
    setText("");
    try {
      const msg = await api.post(`/merchant/shipping/${id}/messages`, { body });
      setMessages((prev) => [...prev, msg]);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("merchant.shippingDetail.sendFailed"));
      setText(body);
    } finally {
      setSending(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }

  if (loading) return <p className="text-center text-ivory/40 py-10">{t("common.loading")}</p>;
  if (!order)  return <p className="text-center text-ivory/40 py-10">{t("merchant.shippingDetail.orderNotFound")}</p>;

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/merchant/shipping" className="text-[13px] text-gold-300/70 hover:text-gold-300 flex items-center gap-1 mb-3">
          <Icon name="chevronLeft" size={15} /> {t("merchant.shippingDetail.backToOrders")}
        </Link>
        <h1 className="serif text-xl font-bold text-ivory">{order.id}</h1>
        <p className="text-[12px] text-ivory/50 mt-1">{order.account} · {new Date(order.createdAt).toLocaleString()}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          {/* Order items */}
          {items.length > 0 && (
            <div className="card-dark overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-gold-400/10">
                    <th className="text-left px-4 py-3 text-[11px] text-ivory/50 font-semibold uppercase tracking-wider">{t("merchant.shippingDetail.product")}</th>
                    <th className="text-center px-4 py-3 text-[11px] text-ivory/50 font-semibold uppercase tracking-wider">{t("merchant.shippingDetail.qty")}</th>
                    <th className="text-right px-4 py-3 text-[11px] text-ivory/50 font-semibold uppercase tracking-wider">{t("merchant.shippingDetail.total")}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, i) => (
                    <tr key={i} className="border-b border-gold-400/8 last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {item.snapshot?.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={item.snapshot.image} alt="" className="w-9 h-9 rounded-lg object-cover border border-gold-400/15 shrink-0" />
                          )}
                          <div>
                            <p className="text-[11px] text-ivory/40 uppercase tracking-wide">{item.snapshot?.brand}</p>
                            <p className="text-ivory line-clamp-1">{item.snapshot?.title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-ivory/70">{item.qty}</td>
                      <td className="px-4 py-3 text-right font-semibold text-ivory">{money(item.lineTotal)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-ivory/60 font-medium">{t("merchant.shippingDetail.total")}</td>
                    <td className="px-4 py-3 text-right font-bold gold-text">{money(order.total)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Status update */}
          <div className="card-dark p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="field-dark sm:w-44">
              {STATUSES.map((s) => <option key={s} value={s}>{t(`merchant.status.${s}`)}</option>)}
            </select>
            <input
              value={merchantNote}
              onChange={(e) => setMerchantNote(e.target.value)}
              placeholder={t("merchant.shippingDetail.notePlaceholder")}
              className="field-dark flex-1"
            />
            <button
              onClick={handleStatusSave}
              disabled={savingStatus || (status === order.status && merchantNote === (order.merchantNote || ""))}
              className={`px-5 h-11 text-[13px] rounded-xl font-medium transition-all shrink-0 disabled:opacity-60 ${
                savedStatus ? "bg-emerald-600/80 text-white" : "btn-primary"
              }`}
            >
              {savingStatus ? t("common.saving") : savedStatus ? t("merchant.shippingDetail.saved") : t("merchant.shippingDetail.updateStatus")}
            </button>
          </div>
        </div>

        {/* Chat — backdrop-filter removed to prevent bleed into adjacent columns */}
        <div className="card-dark flex flex-col h-[65vh] min-h-[400px] max-h-[600px]"
          style={{ backdropFilter: "none", WebkitBackdropFilter: "none" }}>
          <div className="px-4 py-3 border-b border-gold-400/10 text-[13px] font-semibold text-ivory">
            {t("merchant.shippingDetail.orderChat")}
          </div>
          <div ref={chatRef} className="flex-1 overflow-y-auto chat-scrollbar px-4 py-3 space-y-3">
            {loadingMsgs && !messages.length ? (
              <p className="text-center text-ivory/30 text-[13px] pt-6">{t("common.loading")}</p>
            ) : messages.length === 0 ? (
              <p className="text-center text-ivory/30 text-[13px] pt-6">{t("merchant.shippingDetail.noMessages")}</p>
            ) : messages.map((m) => (
              <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
                {m.sender === "admin" ? (
                  /* Merchant bubble — right, gold */
                  <div className="max-w-[80%] rounded-2xl px-4 py-2.5 text-[13px] bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900">
                    <p className="whitespace-pre-wrap break-words">{m.body}</p>
                    <p className="text-[10px] mt-1 text-ink-900/40">{new Date(m.createdAt).toLocaleString()}</p>
                  </div>
                ) : (
                  /* User bubble — left, frosted with gold accent */
                  <div className="max-w-[80%] flex gap-2 items-end">
                    <div className="w-6 h-6 rounded-full bg-gold-400/20 border border-gold-400/30 flex items-center justify-center shrink-0 mb-1">
                      <span className="text-[9px] font-bold text-gold-300 uppercase leading-none">
                        {(order?.account || "U")[0]}
                      </span>
                    </div>
                    <div className="rounded-2xl rounded-bl-sm px-4 py-2.5 text-[13px] text-ivory border border-white/10"
                      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.04) 100%)" }}>
                      <p className="text-[10px] font-semibold tracking-wide text-gold-300/60 mb-0.5 uppercase">{order?.account || t("merchant.shippingDetail.user")}</p>
                      <p className="whitespace-pre-wrap break-words">{m.body}</p>
                      <p className="text-[10px] mt-1 text-ivory/35">{new Date(m.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 py-3 border-t border-gold-400/10 flex items-end gap-2">
            <textarea
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={onKeyDown}
              placeholder={t("merchant.shippingDetail.messagePlaceholder")}
              rows={1}
              className="field-dark flex-1 resize-none !h-auto !py-3 overflow-y-auto input-scrollbar"
              style={{ minHeight: "44px", maxHeight: "120px" }}
            />
            <button
              onClick={sendMessage}
              disabled={sending || !text.trim()}
              className="btn-primary w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-60 mb-px"
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
