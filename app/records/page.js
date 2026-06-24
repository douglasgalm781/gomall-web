"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";
import Pagination from "@/components/Pagination";

const STATUS_TABS = ["all", "completed", "reviewing"];
const PAGE_SIZE = 10;

const STATUS_STYLE = {
  completed: "bg-emerald-500/15 text-emerald-400",
  reviewing: "bg-gold-400/15 text-gold-300",
  rejected:  "bg-red-500/15 text-red-400",
};

export default function HistoryPage() {
  const { t }   = useI18n();
  const { fmt } = useCurrency();

  const [kind,        setKind]        = useState("all");
  const [status,      setStatus]      = useState("all");
  const [page,        setPage]        = useState(1);
  const [recharges,   setRecharges]   = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get("/recharge").then((d) => setRecharges(d.items  || [])),
      api.get("/withdraw").then((d) => setWithdrawals(d.items || [])),
    ]).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const allItems = [
    ...recharges.map((r)   => ({ ...r, _kind: "recharge"   })),
    ...withdrawals.map((r) => ({ ...r, _kind: "withdrawal" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const byKind   = kind   === "all" ? allItems : allItems.filter((r) => r._kind === kind);
  const filtered = status === "all" ? byKind   : byKind.filter((r) => r.status === status);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function changeKind(k)   { setKind(k);   setPage(1); }
  function changeStatus(s) { setStatus(s); setPage(1); }

  const totalIn  = recharges.filter((r)   => r.status === "completed").reduce((s, r) => s + r.amount, 0);
  const totalOut = withdrawals.filter((r) => r.status === "completed").reduce((s, r) => s + r.amount, 0);

  return (
    <div className="luxe min-h-screen pb-10">
      <BackHeader title={t("records.historyTitle")} dark />

      <div className="px-4 md:px-8 lg:px-12 pt-4 space-y-4">

        {/* ── Summary ───────────────────────────────────────────── */}
        <div className="card-dark p-5 grid grid-cols-2 divide-x divide-gold-400/12">
          <div className="pr-5">
            <p className="text-[11px] text-ivory/40 uppercase tracking-[0.15em]">{t("records.totalIn")}</p>
            <p className="text-[22px] font-bold gold-text mt-1 tracking-tight">{fmt(totalIn)}</p>
          </div>
          <div className="pl-5">
            <p className="text-[11px] text-ivory/40 uppercase tracking-[0.15em]">{t("records.totalOut")}</p>
            <p className="serif text-[22px] font-bold text-ivory mt-1">{fmt(totalOut)}</p>
          </div>
        </div>

        {/* ── Type filter ───────────────────────────────────────── */}
        <div className="flex gap-2">
          {[
            { key: "all",        label: t("records.all"),           icon: null        },
            { key: "recharge",   label: t("records.rechargeTitle"), icon: "deposit"   },
            { key: "withdrawal", label: t("records.withdrawTitle"), icon: "withdraw"  },
          ].map((tab) => (
            <button key={tab.key} onClick={() => changeKind(tab.key)}
              className={`flex-1 h-9 rounded-xl text-[12px] font-semibold flex items-center justify-center gap-1.5 transition ${
                kind === tab.key
                  ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900"
                  : "gold-hairline bg-white/5 text-ivory/60"
              }`}>
              {tab.icon && <Icon name={tab.icon} size={13} />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Status filter ─────────────────────────────────────── */}
        <div className="flex gap-2">
          {STATUS_TABS.map((s) => (
            <button key={s} onClick={() => changeStatus(s)}
              className={`flex-1 h-9 rounded-xl text-[12px] font-semibold transition ${
                status === s
                  ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900"
                  : "gold-hairline bg-white/5 text-ivory/60"
              }`}>
              {t(`records.${s}`)}
            </button>
          ))}
        </div>

        {/* ── Unified list ──────────────────────────────────────── */}
        {loading ? (
          <div className="text-center text-ivory/40 text-[13px] py-10">{t("common.loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Icon name="receipt" size={36} className="text-gold-300/20 mb-3" />
            <p className="text-[14px] text-ivory/50">{t("records.empty")}</p>
            <p className="text-[12px] text-ivory/30 mt-1">{t("records.emptyHint")}</p>
          </div>
        ) : (
          <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {paged.map((r) => {
              const isIn = r._kind === "recharge";
              return (
                <div key={r.id} className="card-dark p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIn ? "bg-gold-400/15 gold-hairline" : "bg-white/8 gold-hairline"}`}>
                      <Icon name={isIn ? "deposit" : "withdraw"} size={18} className={isIn ? "text-gold-300" : "text-ivory/60"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-semibold text-ivory">{isIn ? r.method : r.walletType}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] ?? "bg-white/8 text-ivory/50"}`}>
                          {t(`records.${r.status}`)}
                        </span>
                      </div>
                      <div className="text-[11px] text-ivory/40 mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>
                      <div className="text-[10px] text-ivory/20 mt-0.5 font-mono truncate">{r.id}</div>
                    </div>
                    <div className={`text-[15px] font-bold shrink-0 ${isIn ? "text-emerald-400" : "text-ivory/80"}`}>
                      {isIn ? "+" : "−"}{fmt(r.amount)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
