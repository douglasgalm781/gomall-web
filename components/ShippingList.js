"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { fmtNative } from "@/lib/currency";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";

export const STATUS_PILL = {
  pending:    "pill-warning",
  processing: "pill-warning",
  shipped:    "pill-info",
  delivered:  "pill-success",
  cancelled:  "pill-danger",
};

const STATUS_ORDER = { pending: 0, processing: 1, shipped: 2, delivered: 3, cancelled: 4 };

const SORTS = [
  { key: "newest", labelKey: "products.sortNewest" },
  { key: "oldest", labelKey: "shipping.sortOldest" },
  { key: "status", labelKey: "shipping.sortStatus" },
];

function applySorting(list, sort) {
  const arr = [...list];
  if (sort === "oldest") return arr.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sort === "status") return arr.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));
  return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

// Compact card for completed (delivered/cancelled) orders —
// shows only order date, total, and the completion date.
function CompletedCard({ o, onClick, t }) {
  const isDelivered = o.status === "delivered";
  return (
    <button
      onClick={onClick}
      className="w-full card-dark px-4 py-3.5 text-left active:scale-[0.995] transition group flex items-center justify-between gap-4"
    >
      <div className="min-w-0">
        <span className="text-[12px] text-ivory/40 font-mono block">
          {new Date(o.createdAt).toLocaleDateString()}
        </span>
        <span className="text-[11px] text-ivory/30 mt-0.5 block">
          {t(isDelivered ? "shipping.completedOn" : "shipping.cancelledOn")}{" "}
          {new Date(o.updatedAt).toLocaleDateString()}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className={`pill ${STATUS_PILL[o.status] || "pill-muted"}`}>
          {t(`shipping.status.${o.status}`)}
        </span>
        <span className="text-[14px] font-semibold gold-text tracking-tight">
          {fmtNative(o.payAmount || o.total, o.payCurrency || "USD")}
        </span>
      </div>
    </button>
  );
}

// Full card for in-progress (pending/processing/shipped) orders.
function ActiveCard({ o, onClick, t }) {
  const totalQty = o.items.reduce((sum, item) => sum + item.qty, 0);
  return (
    <button
      onClick={onClick}
      className="w-full card-dark p-4 text-left active:scale-[0.995] transition group"
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[12px] text-ivory/40 font-mono">
          {new Date(o.createdAt).toLocaleString()}
        </span>
        <span className={`pill ${STATUS_PILL[o.status] || "pill-muted"}`}>
          {t(`shipping.status.${o.status}`)}
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2 shrink-0">
          {o.items.slice(0, 3).map((item, i) => (
            <LuxImage
              key={i}
              src={item.snapshot.image}
              alt={item.snapshot.brand}
              className="w-14 h-14 rounded-xl shrink-0 gold-hairline"
            />
          ))}
          {o.items.length > 3 && (
            <div className="w-14 h-14 rounded-xl shrink-0 gold-hairline bg-white/5 flex items-center justify-center text-ivory/50 text-[12px] font-semibold">
              +{o.items.length - 3}
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] text-ivory/75 leading-snug line-clamp-2">
            {o.items.slice(0, 2).map((item) => item.snapshot.title).join(", ")}
            {o.items.length > 2 && ` +${o.items.length - 2}`}
          </p>
          {o.adminNote && (
            <p className="text-[11px] text-ivory/35 mt-1 line-clamp-1 italic">{o.adminNote}</p>
          )}
        </div>
        <Icon name="chevronRight" size={16} className="text-ivory/20 group-hover:text-gold-300/60 transition shrink-0" />
      </div>
      <div className="border-t border-gold-400/12 mt-3 pt-3 flex items-center justify-between">
        <span className="text-[12px] text-ivory/45">
          {t("profile.overview.itemCount").replace("{n}", totalQty)}
        </span>
        <span className="text-[15px] font-semibold gold-text tracking-tight">
          {fmtNative(o.payAmount || o.total, o.payCurrency || "USD")}
        </span>
      </div>
    </button>
  );
}

// Shared shipping order list with sort controls.
// Parent is responsible for loading state and empty state.
export default function ShippingList({ list }) {
  const router = useRouter();
  const { t }  = useI18n();
  const [sort,     setSort]     = useState("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const sorted = applySorting(list, sort);

  return (
    <div>
      {list.length > 1 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] text-ivory/40">
            {t("profile.overview.itemCount").replace("{n}", list.length)}
          </span>
          <div ref={sortRef} className="relative">
            <button
              type="button"
              onClick={() => setSortOpen((v) => !v)}
              className="h-9 pl-8 pr-8 rounded-xl bg-white/5 gold-hairline text-[13px] text-ivory/80 outline-none cursor-pointer hover:border-gold-400/50 transition flex items-center relative"
            >
              <Icon name="trending" size={13} className="absolute left-3 text-gold-300/60 pointer-events-none" />
              {t(SORTS.find((s) => s.key === sort)?.labelKey)}
              <Icon name="chevronDown" size={13} className="absolute right-3 text-ivory/40 pointer-events-none" />
            </button>
            {sortOpen && (
              <div className="absolute right-0 top-full mt-1.5 bg-[#1a1510] border border-gold-400/25 rounded-xl py-1.5 min-w-[180px] z-50 shadow-lux">
                {SORTS.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => { setSort(s.key); setSortOpen(false); }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] transition ${
                      sort === s.key
                        ? "text-gold-300 bg-gold-400/12 font-semibold"
                        : "text-ivory/70 hover:bg-white/6 hover:text-ivory"
                    }`}
                  >
                    {t(s.labelKey)}
                    {sort === s.key && <Icon name="check" size={12} className="text-gold-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {sorted.map((o) => {
          const isCompleted = o.status === "delivered" || o.status === "cancelled";
          const onClick = () => router.push(`/shipping/${o.id}`);
          return isCompleted
            ? <CompletedCard key={o.id} o={o} onClick={onClick} t={t} />
            : <ActiveCard    key={o.id} o={o} onClick={onClick} t={t} />;
        })}
      </div>
    </div>
  );
}
