"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Icon from "@/components/Icon";
import { useI18n } from "@/lib/i18n";

const STATUS_PILL = {
  pending:    "pill-warning",
  processing: "bg-sky-500/15 text-sky-300",
  shipped:    "bg-violet-500/15 text-violet-300",
  delivered:  "pill-success",
  cancelled:  "pill-error",
};

function money(v) {
  return `$${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const STATUSES = ["all","pending","processing","shipped","delivered","cancelled"];

export default function MerchantShipping() {
  const { t } = useI18n();
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [status,  setStatus]  = useState("all");

  function load() {
    setLoading(true);
    const qs = status !== "all" ? `?status=${status}` : "";
    api.get(`/merchant/shipping${qs}`)
      .then((d) => setOrders(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <h1 className="serif text-2xl font-bold text-ivory">{t("merchant.shipping.title")}</h1>

      {/* Status filter */}
      <div className="flex gap-1 flex-wrap">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-[12px] font-semibold transition ${
              status === s ? "bg-gold-400/20 text-gold-300" : "bg-white/5 text-ivory/50 hover:text-ivory"
            }`}
          >
            {t(`merchant.status.${s}`)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-ivory/40 py-10">{t("common.loading")}</p>
      ) : orders.length === 0 ? (
        <div className="card-dark p-10 text-center text-ivory/40">
          <Icon name="truck" size={32} className="mx-auto mb-3 opacity-30" />
          <p>{t("merchant.shipping.noOrders")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => (
            <Link
              key={o.id}
              href={`/merchant/shipping/${o.id}`}
              className="card-dark p-4 flex items-center gap-4 hover:border-gold-400/30 transition block"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`pill text-[10px] ${STATUS_PILL[o.status] || "pill-warning"}`}>{t(`merchant.status.${o.status}`)}</span>
                  {o.unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-gold-400 text-ink-900 text-[10px] font-bold flex items-center justify-center">
                      {o.unread}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-gold-300/80 font-mono">{o.id}</p>
                <p className="text-[12px] text-ivory/50 mt-0.5">{o.account} · {new Date(o.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[15px] font-bold gold-text">{money(o.total)}</p>
              </div>
              <Icon name="chevronRight" size={16} className="text-ivory/30 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
