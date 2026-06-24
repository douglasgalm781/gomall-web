"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import Icon from "@/components/Icon";
import { useCurrency } from "@/lib/currency";
import { useI18n } from "@/lib/i18n";

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card-dark p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon name={icon} size={20} />
      </div>
      <div>
        <p className="text-[12px] text-ivory/50 mb-0.5">{label}</p>
        <p className="text-[20px] font-bold gold-text">{value}</p>
      </div>
    </div>
  );
}

export default function MerchantDashboard() {
  const { t } = useI18n();
  const { fmt: fmtCurrency } = useCurrency();
  const PERIODS = [
    { key: "7d",  label: t("merchant.dashboard.period7d")  },
    { key: "30d", label: t("merchant.dashboard.period30d") },
    { key: "90d", label: t("merchant.dashboard.period90d") },
  ];
  const [period, setPeriod] = useState("30d");
  const [data,   setData]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.get(`/merchant/analytics?period=${period}`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const fmt = (n) => fmtCurrency(Number(n || 0));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="serif text-2xl font-bold text-ivory">{t("merchant.dashboard.title")}</h1>
        <div className="flex gap-1 bg-white/5 rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${
                period === p.key ? "bg-gold-400/20 text-gold-300" : "text-ivory/50 hover:text-ivory"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-ivory/40 py-10">{t("common.loading")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label={t("merchant.dashboard.totalRevenue")} value={fmt(data?.totalRevenue)} icon="coins" color="bg-gold-400/12 text-gold-300" />
            <StatCard label={t("merchant.dashboard.totalOrders")}  value={data?.totalOrders ?? 0} icon="receipt" color="bg-sky-500/12 text-sky-300" />
          </div>

          {/* Daily chart (simple bar) */}
          {data?.daily?.length > 0 && (
            <div className="card-dark p-5 space-y-3">
              <h3 className="text-[13px] font-semibold text-ivory/70">{t("merchant.dashboard.dailyRevenue")}</h3>
              <div className="flex items-end gap-1 h-24">
                {(() => {
                  const max = Math.max(...data.daily.map((d) => d.revenue), 1);
                  return data.daily.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                      <div
                        className="w-full bg-gold-400/30 rounded-t-sm hover:bg-gold-400/60 transition relative group"
                        style={{ height: `${Math.max((d.revenue / max) * 100, 2)}%` }}
                      >
                        <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[#1a1510] border border-gold-400/30 rounded px-2 py-1 text-[10px] text-gold-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                          {fmt(d.revenue)}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Top products */}
          {data?.topProducts?.length > 0 && (
            <div className="card-dark p-5 space-y-3">
              <h3 className="text-[13px] font-semibold text-ivory/70">{t("merchant.dashboard.topProducts")}</h3>
              <div className="space-y-2">
                {data.topProducts.map((p) => (
                  <div key={p.id} className="flex items-center gap-3">
                    {p.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-gold-400/15 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] text-ivory truncate">{p.title}</p>
                      <p className="text-[11px] text-ivory/40">{t("merchant.dashboard.sold").replace("{n}", p.totalQty)}</p>
                    </div>
                    <span className="text-[13px] font-semibold gold-text shrink-0">{fmt(p.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.totalOrders === 0 && (
            <div className="card-dark p-8 text-center text-ivory/40">
              <Icon name="receipt" size={32} className="mx-auto mb-3 opacity-30" />
              <p className="text-[14px]">{t("merchant.dashboard.noOrders")}</p>
              <Link href="/merchant/products" className="btn-primary inline-flex mt-4 px-6 h-10 text-[13px]">
                {t("merchant.dashboard.addFirstProduct")}
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
