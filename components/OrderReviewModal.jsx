"use client";
import { useState } from "react";
import StarRating from "./StarRating";
import LuxImage from "./LuxImage";
import { useI18n } from "@/lib/i18n";

export default function OrderReviewModal({ order, onCancel, onConfirm }) {
  const { t } = useI18n();
  const [cabin, setCabin] = useState(3);
  const [service, setService] = useState(3);
  const [airline, setAirline] = useState(3);
  const [comment, setComment] = useState("");

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm px-4 pb-4">
      <div className="w-full max-w-[400px] card-dark p-5 animate-sheet">
        {/* product */}
        <div className="flex gap-3 items-start">
          <LuxImage src={order.product.image} alt={order.product.brand} className="w-16 h-16 rounded-xl shrink-0 gold-hairline" />
          <div>
            <div className="text-gold-300/80 text-[10px] tracking-[0.2em] uppercase">{order.product.brand}</div>
            <p className="text-[13px] text-ivory/90 leading-snug line-clamp-2 mt-0.5">{order.product.title}</p>
          </div>
        </div>

        {/* totals */}
        <div className="grid grid-cols-3 mt-5 mb-4 rounded-xl bg-white/5 gold-hairline divide-x divide-gold-400/15">
          {[
            [t("review.orderTotal"), `$${order.total.toLocaleString("en-US")}`],
            [t("review.diff"), "$0"],
            [t("review.commission"), `$${order.commission.toFixed(2)}`, true],
          ].map(([label, val, accent], i) => (
            <div key={i} className="py-3 text-center">
              <div className="text-[11px] text-ivory/50">{label}</div>
              <div className={`serif text-[15px] font-semibold mt-1 ${accent ? "gold-text" : "text-ivory"}`}>{val}</div>
            </div>
          ))}
        </div>

        {/* ratings */}
        <div className="divide-y divide-gold-400/12 border-y border-gold-400/12">
          {[
            [t("review.cabin"), cabin, setCabin],
            [t("review.service"), service, setService],
            [t("review.airline"), airline, setAirline],
          ].map(([label, val, set]) => (
            <div key={label} className="flex items-center justify-between py-3">
              <span className="text-[13px] text-ivory/60">{label}</span>
              <StarRating value={val} onChange={set} />
            </div>
          ))}
        </div>

        {/* comment */}
        <div className="py-4">
          <span className="text-[13px] text-ivory/60">{t("review.comment")}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full mt-2 bg-white/5 gold-hairline rounded-xl p-3 text-[14px] text-ivory resize-none focus:outline-none focus:border-gold-400"
          />
        </div>

        {/* actions */}
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 h-[50px]">{t("common.cancel")}</button>
          <button onClick={() => onConfirm?.({ cabin, service, airline, comment })} className="btn-primary flex-1 h-[50px]">
            {t("common.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
