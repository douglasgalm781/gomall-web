"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { refreshSession } from "@/lib/store";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useWss } from "@/lib/wss";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";

export const STEP_AWAITING   = 0;
export const STEP_PROCESSING = 1;
export const STEP_COMPLETE   = 2;

export function fbCopy(text) {
  const el = document.createElement("textarea");
  el.value = text;
  el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
  document.body.appendChild(el);
  el.focus(); el.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch (_) {}
  document.body.removeChild(el);
  return ok;
}

// ── Step indicator ─────────────────────────────────────────────────────────────
export function StepBar({ step }) {
  const { t } = useI18n();
  const labels = [
    t("recharge.stepAwaiting"),
    t("recharge.stepProcessing"),
    t("recharge.stepComplete"),
  ];
  return (
    <div className="flex items-center justify-center mb-5 select-none">
      {labels.map((label, i) => {
        const done   = step > i;
        const active = step === i;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                done    ? "bg-emerald-500 text-white" :
                active  ? "bg-gold-400 text-ink-900 ring-2 ring-gold-400/30" :
                          "bg-white/10 text-ivory/25"
              }`}>
                {done ? <Icon name="check" size={13} /> : <span>{i + 1}</span>}
              </div>
              <span className={`text-[9px] font-semibold mt-1.5 tracking-wider transition-all ${
                done    ? "text-emerald-400" :
                active  ? "text-gold-300" :
                          "text-ivory/20"
              }`}>
                {label}
              </span>
            </div>
            {i < labels.length - 1 && (
              <div className={`w-10 h-px mb-5 mx-1 transition-all ${step > i ? "bg-emerald-500/50" : "bg-white/10"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── USDT deposit sheet (modal overlay) ────────────────────────────────────────
export function UsdtDepositSheet({ method, onClose }) {
  const { t } = useI18n();
  const toast = useToast();
  const [step,        setStep]        = useState(STEP_AWAITING);
  const [depositInfo, setDepositInfo] = useState(null);
  const [addrLoading, setAddrLoading] = useState(true);
  const pollerRef = useRef(null);
  const stepRef   = useRef(STEP_AWAITING);
  stepRef.current = step;

  useEffect(() => {
    api.get(`/recharge/deposit-address?channel=${method.key}`)
      .then((d) => setDepositInfo(d))
      .catch(() => toast.error(t("recharge.addrLoadFailed")))
      .finally(() => setAddrLoading(false));
  }, [method.key, t]);

  const handleWss = useCallback((event) => {
    if (event.type !== "deposit") return;
    const status = event.data?.status ?? event.status;
    if (status === "processing" && stepRef.current === STEP_AWAITING) {
      setStep(STEP_PROCESSING);
    }
    if (status === "completed" && stepRef.current < STEP_COMPLETE) {
      setStep(STEP_COMPLETE);
      clearInterval(pollerRef.current);
      refreshSession();
    }
  }, []);

  useWss(handleWss);

  // Fallback polling every 15 s while AWAITING
  useEffect(() => {
    if (step !== STEP_AWAITING || !depositInfo) return;
    const poll = async () => {
      try {
        const res = await api.get(
          `/recharge/deposit-status?channel=${method.key}&since=${encodeURIComponent(depositInfo.since || "")}`
        );
        if (res.detected) {
          setStep(STEP_COMPLETE);
          clearInterval(pollerRef.current);
          refreshSession();
        }
      } catch (_) {}
    };
    pollerRef.current = setInterval(poll, 15_000);
    return () => clearInterval(pollerRef.current);
  }, [step, depositInfo, method.key]);

  const copyAddr = async () => {
    if (!depositInfo?.address) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(depositInfo.address);
        toast.success(t("common.copied"));
        return;
      }
    } catch (_) {}
    if (fbCopy(depositInfo.address)) toast.success(t("common.copied"));
    else toast.error(t("common.copyFailed") ?? "Copy failed");
  };

  const isErc20 = method.key === "usdt_erc20";
  const networkLabel = isErc20 ? "ERC20" : "TRC20";
  const netColor = isErc20
    ? "bg-blue-500/12 text-blue-400 border-blue-500/25"
    : "bg-red-500/12 text-red-400 border-red-500/25";

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="card-dark chat-scrollbar w-full max-w-[400px] rounded-2xl p-5 overflow-y-auto max-h-[90vh]" style={{ background: 'rgba(12, 10, 7, 0.92)' }}>

        {/* Header */}
        <div className="flex items-start justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center shrink-0">
              <Icon name="deposit" size={20} className="text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-ivory leading-tight">{t("recharge.usdtDeposit")}</h3>
              <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border mt-0.5 ${netColor}`}>
                {networkLabel}
              </span>
            </div>
          </div>
          {step !== STEP_COMPLETE && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-ivory/40 hover:text-ivory/70 transition">
              <Icon name="close" size={20} />
            </button>
          )}
        </div>

        <StepBar step={step} />

        {/* ── AWAITING ── */}
        {step === STEP_AWAITING && (
          <div className="flex flex-col items-center">
            {addrLoading ? (
              <div className="py-14 flex flex-col items-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-gold-400/25 border-t-gold-400 animate-spin" />
                <p className="text-[13px] text-ivory/40">{t("recharge.loadingAddress")}</p>
              </div>
            ) : depositInfo?.address ? (
              <>
                <div className="p-3 rounded-2xl bg-ivory border-2 border-gold-300/30">
                  <QRCodeSVG value={depositInfo.address} size={160} fgColor="#15110a" bgColor="#f8f4ea" />
                </div>

                <div className="mt-4 w-full">
                  <p className="text-[10px] font-semibold text-gold-300/60 uppercase tracking-widest mb-1.5">
                    {t("recharge.yourNetworkAddress").replace("{n}", networkLabel)}
                  </p>
                  <div className="flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5">
                    <span className="flex-1 text-[10.5px] text-ivory/65 break-all leading-relaxed font-mono">
                      {depositInfo.address}
                    </span>
                    <button
                      onClick={copyAddr}
                      className="shrink-0 w-8 h-8 rounded-lg bg-gold-400/10 border border-gold-400/20 flex items-center justify-center text-gold-300 hover:bg-gold-400/20 transition"
                    >
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-3.5 w-full rounded-xl bg-amber-500/8 border border-amber-500/20 p-3.5">
                  <div className="flex items-start gap-2.5">
                    <Icon name="info" size={13} className="text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11.5px] text-amber-300/80 leading-relaxed">
                      {t("recharge.usdtSendHint").replace("{n}", networkLabel)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                  </span>
                  <p className="text-[11.5px] text-ivory/40">{t("recharge.watchingOnChain")}</p>
                </div>

                <button onClick={onClose} className="mt-5 w-full h-11 rounded-xl gold-hairline bg-white/5 text-ivory/55 text-[13px] font-semibold hover:bg-white/10 transition">
                  {t("common.cancel")}
                </button>
              </>
            ) : (
              <div className="py-10 text-center">
                <Icon name="alert" size={32} className="text-red-400 mx-auto mb-3" />
                <p className="text-[13px] text-ivory/50">{t("recharge.addressUnavailable")}</p>
                <button onClick={onClose} className="mt-5 btn-ghost px-8 h-11">{t("common.cancel")}</button>
              </div>
            )}
          </div>
        )}

        {/* ── PROCESSING ── */}
        {step === STEP_PROCESSING && (
          <div className="flex flex-col items-center py-6">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-amber-400/20 border-t-amber-400 animate-spin" />
              <div className="w-12 h-12 rounded-2xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center">
                <Icon name="zap" size={22} className="text-amber-400" />
              </div>
            </div>
            <p className="text-[17px] font-bold text-ivory mt-5">{t("recharge.transferDetected")}</p>
            <p className="text-[13px] text-ivory/55 mt-2 text-center leading-relaxed max-w-[260px]">
              {t("recharge.transferDetectedDesc")}
            </p>
            <div className="mt-5 w-full rounded-xl bg-amber-500/8 border border-amber-500/20 p-3.5">
              <p className="text-[11.5px] text-amber-300/70 text-center">{t("recharge.sweepWait")}</p>
            </div>
          </div>
        )}

        {/* ── COMPLETE ── */}
        {step === STEP_COMPLETE && (
          <div className="flex flex-col items-center py-6">
            <div className="w-20 h-20 rounded-full bg-emerald-500/12 border-2 border-emerald-500/30 flex items-center justify-center">
              <Icon name="checkCircle" size={32} className="text-emerald-400" />
            </div>
            <p className="text-[17px] font-bold text-ivory mt-5">{t("recharge.depositCredited")}</p>
            <p className="text-[13px] text-ivory/55 mt-2 text-center leading-relaxed max-w-[260px]">
              {t("recharge.depositCreditedDesc")}
            </p>
            <div className="mt-5 w-full rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3">
              <div className="flex items-center justify-center gap-2">
                <Icon name="checkCircle" size={13} className="text-emerald-400" />
                <p className="text-[11.5px] text-emerald-400 font-semibold">{t("recharge.txComplete")}</p>
              </div>
            </div>
            <button onClick={onClose} className="btn-primary w-full h-12 rounded-xl mt-5 text-[14px] font-semibold">
              {t("recharge.done")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
