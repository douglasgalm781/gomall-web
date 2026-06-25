"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";
import SaleBadge from "@/components/SaleBadge";
import BackHeader from "@/components/BackHeader";

export default function LikesPage() {
  const router  = useRouter();
  const { t }   = useI18n();
  const { currency } = useCurrency();

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get(`/likes?currency=${currency.code}`)
      .then((d) => setItems(d.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [currency.code]);

  async function unlike(productId, e) {
    e.stopPropagation();
    await api.post(`/likes/${productId}`).catch(() => {});
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }

  return (
    <div className="luxe min-h-screen pb-24">

      {/* Header */}
      <BackHeader
        title={t("likes.title")}
        dark
        right={items.length > 0 ? <span className="text-[12px] text-ivory/35">{items.length} items</span> : null}
      />

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 text-ivory/40">{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-24 text-center px-8">
          <div className="w-20 h-20 rounded-3xl hero-accent flex items-center justify-center mb-5">
            <Icon name="heart" size={32} className="text-gold-300" />
          </div>
          <p className="text-[16px] font-semibold text-ivory">{t("likes.empty")}</p>
          <p className="text-[13px] text-ivory/45 mt-2 max-w-[260px] leading-relaxed">{t("likes.emptyHint")}</p>
          <Link href="/products" className="btn-primary mt-6 h-11 px-8 flex items-center text-[14px]">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="px-4 md:px-8 lg:px-12 pt-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
            {items.map((p) => (
              <Link
                key={p.id}
                href={`/product/${p.id}`}
                className="group card-dark overflow-hidden block"
              >
                <div className="relative overflow-hidden">
                  <LuxImage
                    src={p.image}
                    alt={p.brand}
                    className="aspect-[4/5] group-hover:scale-105 transition-transform duration-500"
                    label={p.brand}
                  />
                  <button
                    onClick={(e) => unlike(p.id, e)}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full glass-dark gold-hairline text-red-400 flex items-center justify-center hover:scale-110 transition-transform active:scale-90"
                  >
                    <Icon name="heart" size={14} fill="currentColor" strokeWidth={0} />
                  </button>
                  <SaleBadge onSale={p.onSale} price={p.retailPrice} originalPrice={p.originalPrice} size="sm" />
                </div>
                <div className="p-3">
                  <p className="text-[10px] tracking-[0.2em] uppercase text-gold-300/65 truncate">{p.brand}</p>
                  <p className="text-ivory/80 text-[12px] leading-snug line-clamp-2 mt-0.5 min-h-[2.4em]">{p.title}</p>
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    <span className="text-gold-200 text-[13px] font-semibold tracking-tight">{fmtNative(p.retailPrice, currency.code)}</span>
                    {p.onSale && p.originalPrice > p.retailPrice && (
                      <span className="text-ivory/30 text-[11px] line-through">{fmtNative(p.originalPrice, currency.code)}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
