"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, refreshSession } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import toast from "react-hot-toast";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";

const FEE_RATE  = 0.01;
const MIN_AMT   = 50;
const QUICK_PCTS = [
  { pct: 0.25, label: "25%" },
  { pct: 0.5,  label: "50%" },
  { pct: 0.75, label: "75%" },
  { pct: 1,    label: "MAX" },
];

function maskAddr(addr) {
  if (!addr || addr.length < 10) return addr ?? "";
  return addr.slice(0, 6) + "···" + addr.slice(-4);
}

export default function WithdrawPage() {
  const session = useSession();
  const { t }   = useI18n();
  const router  = useRouter();

  const wallets = session?.wallets || {};
  const wallet  = session?.wallet  ?? null;

  const walletCodes = Object.keys(wallets);
  const [withdrawCurrency, setWithdrawCurrency] = useState(() => {
    if (walletCodes.includes("USD")) return "USD";
    return walletCodes[0] || "USD";
  });

  const balance = wallets[withdrawCurrency] ?? 0;

  const [amount, setAmount] = useState("");
  const [sheet,  setSheet]  = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const num = Number(amount) || 0;
  const fee = Number((num * FEE_RATE).toFixed(2));
  const net = Number((num - fee).toFixed(2));

  const openSheet = () => {
    if (!num || num < MIN_AMT) return toast.error(t("withdraw.minMsg"));
    if (num > balance)         return toast.error(t("withdraw.insufficient"));
    setSheet(true);
  };

  const confirm = async () => {
    setSubmitting(true);
    try {
      await api.post("/withdraw", { amount: num, currency: withdrawCurrency });
      await refreshSession();
      setSheet(false);
      setAmount("");
      toast.success(t("withdraw.submittedMsg"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="luxe min-h-screen pb-10">
      <BackHeader title={t("withdraw.title")} dark />

      <div className="px-4 pt-4 space-y-4 md:max-w-md md:mx-auto">
        {/* ── wallet selector ──────────────────────────────────────── */}
        {walletCodes.length > 1 && (
          <div className="card-dark p-5">
            <p className="text-[11px] font-semibold text-ivory/40 uppercase tracking-widest mb-3">
              {t("withdraw.withdrawFrom") || "Withdraw From"}
            </p>
            <div className="flex flex-wrap gap-2">
              {walletCodes.map((code) => {
                const bal = wallets[code] ?? 0;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => { setWithdrawCurrency(code); setAmount(""); }}
                    className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition ${
                      withdrawCurrency === code
                        ? "border-gold-400/60 bg-gold-400/12 text-gold-300"
                        : "border-white/10 bg-white/5 text-ivory/60 hover:border-gold-400/30"
                    }`}
                  >
                    <span className="text-[12px] font-bold">{code}</span>
                    <span className="text-[11px] opacity-70">
                      {bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── balance hero ─────────────────────────────────────────── */}
        <div className="hero-accent rounded-xl2 p-5 relative overflow-hidden">
          <div className="orb animate-orb w-36 h-36 bg-gold-400/25 -top-12 -right-8" />
          <div className="orb w-24 h-24 bg-gold-700/30 bottom-0 -left-6" />
          <div className="flex items-center gap-2 text-gold-300/90 text-[12px] tracking-widest uppercase">
            <Icon name="wallet" size={15} /> {t("withdraw.available")}
          </div>
          <div className="text-[32px] font-bold mt-1.5 gold-text tracking-tight">
            {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[20px] ml-2 opacity-70">{withdrawCurrency}</span>
          </div>
        </div>

        {/* ── withdrawal method / wallet card ─────────────────────── */}
        <div className="card-dark p-5">
          <p className="text-[12px] font-semibold text-gold-300/80 tracking-wide uppercase mb-3">
            {t("withdraw.method")}
          </p>

          {wallet ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gold-hairline bg-gold-400/15 flex items-center justify-center shrink-0">
                <Icon name="coins" size={18} className="text-gold-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-ivory">{wallet.type}</div>
                <div className="text-[11px] text-ivory/45 mt-0.5 font-mono tracking-wide">
                  {maskAddr(wallet.address)}
                </div>
              </div>
              <button
                onClick={() => router.push("/bind-usdt")}
                className="text-[12px] font-semibold text-gold-300 flex items-center gap-0.5 shrink-0"
              >
                {t("withdraw.change")}
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl border border-dashed border-gold-400/30 flex items-center justify-center shrink-0">
                <Icon name="coins" size={18} className="text-ivory/25" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-ivory/55">{t("withdraw.noWallet")}</div>
                <div className="text-[11px] text-ivory/35 mt-0.5">{t("withdraw.noWalletDesc")}</div>
              </div>
              <button
                onClick={() => router.push("/bind-usdt")}
                className="text-[12px] font-semibold text-gold-300 flex items-center gap-0.5 shrink-0"
              >
                {t("withdraw.bindNow")}
                <Icon name="chevronRight" size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ── amount card ──────────────────────────────────────────── */}
        <div className="card-dark p-5">
          <label className="text-[12px] font-medium text-gold-300/80 tracking-wide uppercase">
            {t("withdraw.amount")} · {withdrawCurrency}
          </label>

          <div className="flex items-center gap-2 mt-2 border-b border-gold-400/30 pb-2">
            <span className="text-[18px] font-bold text-gold-400/60">{withdrawCurrency}</span>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder="0.00"
              inputMode="decimal"
              className="flex-1 serif text-[26px] font-bold text-ivory placeholder:text-ivory/25 focus:outline-none bg-transparent"
            />
          </div>

          {/* quick % picks */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {QUICK_PCTS.map(({ pct, label }) => {
              const v = Number((balance * pct).toFixed(2));
              return (
                <button
                  key={pct}
                  onClick={() => setAmount(String(v))}
                  className={`h-9 rounded-xl text-[12px] font-semibold transition ${
                    num === v
                      ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900"
                      : "gold-hairline bg-white/5 text-ivory/70"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* fee / receive summary */}
          {num > 0 && (
            <div className="mt-4 pt-3 border-t border-gold-400/15 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-ivory/50">{t("withdraw.fee")}</span>
                <span className="text-ivory/65">−{fee.toFixed(2)} {withdrawCurrency}</span>
              </div>
              <div className="flex justify-between text-[13px] font-semibold">
                <span className="text-ivory/70">{t("withdraw.receive")}</span>
                <span className="text-gold-300">{net.toFixed(2)} {withdrawCurrency}</span>
              </div>
            </div>
          )}
        </div>

        {/* note */}
        <div className="flex gap-2 text-[12px] text-ivory/45 px-1">
          <Icon name="info" size={15} className="shrink-0 mt-0.5 text-gold-300/70" />
          <p className="leading-relaxed">{t("withdraw.note")}</p>
        </div>

        <button
          onClick={openSheet}
          disabled={!wallet}
          className="btn-primary w-full h-[52px] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {t("withdraw.confirm")}
        </button>
      </div>

      {/* ── confirm sheet ────────────────────────────────────────── */}
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center px-4 pb-4">
          <div className="card-dark p-5 w-full max-w-[400px] animate-sheet">
            <div className="flex items-center justify-between mb-4">
              <h3 className="serif text-[17px] font-semibold text-ivory">
                {t("withdraw.confirmTitle")}
              </h3>
              <button
                onClick={() => setSheet(false)}
                className="w-8 h-8 flex items-center justify-center text-ivory/50"
              >
                <Icon name="close" size={20} />
              </button>
            </div>

            <div className="rounded-xl bg-white/5 gold-hairline p-4 space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-ivory/50">{t("withdraw.amount")}</span>
                <span className="font-semibold text-ivory">{num.toFixed(2)} {withdrawCurrency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ivory/50">{t("withdraw.fee")}</span>
                <span className="text-ivory/65">−{fee.toFixed(2)} {withdrawCurrency}</span>
              </div>
              <div className="h-px bg-gold-400/20" />
              <div className="flex justify-between">
                <span className="text-ivory/70 font-medium">{t("withdraw.receive")}</span>
                <span className="font-bold text-gold-300 text-[16px] tracking-tight">{net.toFixed(2)} {withdrawCurrency}</span>
              </div>
              {wallet && (
                <div className="flex justify-between pt-1 border-t border-gold-400/15">
                  <span className="text-ivory/50">{t("withdraw.to")}</span>
                  <div className="text-right">
                    <div className="font-medium text-ivory text-[13px]">{wallet.type}</div>
                    <div className="text-[11px] text-ivory/45 font-mono tracking-wide">
                      {maskAddr(wallet.address)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={() => setSheet(false)} className="btn-ghost flex-1 h-[50px]">
                {t("common.cancel")}
              </button>
              <button onClick={confirm} disabled={submitting} className="btn-primary flex-1 h-[50px] disabled:opacity-60">
                {submitting ? t("common.loading") : t("withdraw.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
