"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";

const TABS = ["all", "completed", "reviewing"];

const STATUS_STYLE = {
  completed: "bg-emerald-500/15 text-emerald-400",
  reviewing: "bg-gold-400/15 text-gold-300",
};

function RecordCard({ r, t, fmt }) {
  return (
    <div className="card-dark p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/8 gold-hairline flex items-center justify-center shrink-0">
          <Icon name="withdraw" size={18} className="text-ivory/60" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[13px] font-semibold text-ivory">{r.walletType}</span>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[r.status] ?? "bg-white/8 text-ivory/50"}`}>
              {t(`records.${r.status}`)}
            </span>
          </div>
          <div className="text-[11px] text-ivory/40 mt-0.5">{new Date(r.createdAt).toLocaleString()}</div>
          <div className="text-[10px] text-ivory/20 mt-0.5 font-mono tracking-wide truncate">{r.id}</div>
        </div>

        <div className="text-right shrink-0">
          <div className="serif text-[15px] font-bold text-ivory/80">
            −{fmt(r.amount)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WithdrawRecordsPage() {
  const { t }   = useI18n();
  const { fmt } = useCurrency();
  const [tab, setTab] = useState("all");
  const [all, setAll] = useState([]);

  useEffect(() => {
    api
      .get("/withdraw")
      .then((data) => setAll(data.items || []))
      .catch(() => {});
  }, []);

  const filtered = tab === "all" ? all : all.filter((r) => r.status === tab);

  const totalOut = all
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="luxe min-h-screen pb-10">
      <BackHeader title={t("records.withdrawTitle")} dark />

      <div className="px-4 md:px-8 lg:px-12 pt-4 space-y-4">
        {/* ── summary card ──────────────────────────────────────── */}
        <div className="card-dark p-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-ivory/45 uppercase tracking-[0.15em]">
              {t("records.totalOut")}
            </p>
            <p className="serif text-[28px] font-bold text-ivory mt-1">
              {fmt(totalOut)}
            </p>
            <p className="text-[12px] text-ivory/40 mt-1">
              {all.length} {t("records.count")}
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/8 gold-hairline flex items-center justify-center">
            <Icon name="withdraw" size={24} className="text-ivory/60" />
          </div>
        </div>

        {/* ── status filter tabs ────────────────────────────────── */}
        <div className="flex gap-2">
          {TABS.map((s) => (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`flex-1 h-9 rounded-xl text-[12px] font-semibold transition ${
                tab === s
                  ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900"
                  : "gold-hairline bg-white/5 text-ivory/60"
              }`}
            >
              {t(`records.${s}`)}
            </button>
          ))}
        </div>

        {/* ── records list ──────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <Icon name="receipt" size={36} className="text-gold-300/20 mb-3" />
            <p className="text-[14px] text-ivory/50">{t("records.empty")}</p>
            <p className="text-[12px] text-ivory/30 mt-1">{t("records.emptyHint")}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filtered.map((r) => (
              <RecordCard key={r.id} r={r} t={t} fmt={fmt} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
