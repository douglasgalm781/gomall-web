"use client";
import { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useSession } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency, CURRENCIES as STATIC_CURRENCIES } from "@/lib/currency";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";
import { UsdtDepositSheet, fbCopy } from "@/components/UsdtDepositSheet";

const EWALLET_INFO = {
  momo: { number: "+84 90 123 4567", name: "GoMall Vietnam Co." },
  zalopay: { number: "+84 90 123 4567", name: "GoMall Vietnam Co." },
  truemoney: { number: "+66 98 765 4321", name: "GoMall (Thailand) Ltd." },
  tng: { number: "+60 12 345 6789", name: "GoMall MY Sdn Bhd" },
};

// Maps a pay-currency code to the regions and method-type/key filters.
// `types`      — filter global region methods by type
// `methodKeys` — filter to specific method keys (used for individual USDT networks)
// `regionTypes`— per-region type override (e.g. only "bank" from global)
const CURRENCY_METHOD_FILTER = {
  "USDT-TRC20": { regions: ["crypto"], methodKeys: ["usdt_trc20"] },
  "USDT-ERC20": { regions: ["crypto"], methodKeys: ["usdt_erc20"] },
  USD: { regions: ["global"], types: ["bank"] },
  CNY: { regions: ["cn", "global"], regionTypes: { global: ["bank"] } },
  VND: { regions: ["vn", "global"], regionTypes: { global: ["bank"] } },
  MYR: { regions: ["my", "global"], regionTypes: { global: ["bank"] } },
  THB: { regions: ["th", "global"], regionTypes: { global: ["bank"] } },
  SGD: { regions: ["global"], types: ["bank"] },
  // Any unknown currency → no entry → show empty-state
};

export default function RechargeContent({ initialAmount, forceCurrencyCode }) {
  const { t } = useI18n();
  const toast = useToast();
  const { fmt: ctxFmt, currency: ctxCurrency, currencies } = useCurrency();
  const session = useSession();
  const fileRef = useRef(null);

  // When opened from the cart modal, lock to the selected pay currency.
  // Fall back to the static CURRENCIES list since USDT-TRC20/ERC20 are not in the API config list.
  const currency = forceCurrencyCode
    ? (currencies.find((c) => c.code === forceCurrencyCode)
      ?? STATIC_CURRENCIES.find((c) => c.code === forceCurrencyCode)
      ?? ctxCurrency)
    : ctxCurrency;

  function fmt(usdAmt, compact = false) {
    if (!forceCurrencyCode) return ctxFmt(usdAmt, compact);
    const raw = usdAmt * (currency.rate || 1);
    const isVND = currency.code === "VND";
    const isUSDT = currency.code === "USDT" || currency.code === "USDT-TRC20" || currency.code === "USDT-ERC20";
    if (compact) {
      if (raw >= 1_000_000) { const v = isVND ? Math.round(raw / 1_000_000) : (raw / 1_000_000).toFixed(1); return isUSDT ? `${v}M USDT` : `${currency.symbol}${v}M`; }
      if (raw >= 1_000) { const v = isVND ? Math.round(raw / 1_000) : (raw / 1_000).toFixed(1); return isUSDT ? `${v}k USDT` : `${currency.symbol}${v}k`; }
    }
    if (isUSDT) return `${raw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
    if (isVND) return `${currency.symbol}${Math.round(raw).toLocaleString("en-US")}`;
    return `${currency.symbol}${raw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  const [amount, setAmount] = useState(
    initialAmount != null && Number(initialAmount) > 0
      ? String(Number(initialAmount).toFixed(2))
      : ""
  );
  const [expandedRegions, setExpandedRegions] = useState(new Set());
  const [activeRegion, setActiveRegion] = useState(null);
  const [method, setMethod] = useState(null);
  const [usdtMethod, setUsdtMethod] = useState(null);
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [config, setConfig] = useState({ presets: [], regions: [], methods: {}, paymentInfo: {} });

  useEffect(() => {
    api.get("/config").then((d) => {
      const regs = d.rechargeRegions || [];
      setConfig({
        presets: d.rechargePresets || [],
        regions: regs,
        methods: d.payMethodsByRegion || {},
        paymentInfo: d.paymentInfo || {},
      });
      // Auto-expand: if forced currency, expand the relevant region; else expand first
      const filter = forceCurrencyCode ? CURRENCY_METHOD_FILTER[forceCurrencyCode] : null;
      const firstVisible = filter
        ? regs.find((r) => filter.regions.includes(r.key))
        : regs[0];
      if (firstVisible) setExpandedRegions(new Set([firstVisible.key]));
    }).catch(() => { });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived filtered regions when opened from the cart modal
  const methodFilter = forceCurrencyCode ? CURRENCY_METHOD_FILTER[forceCurrencyCode] : null;
  const visibleRegions = methodFilter
    ? config.regions.filter((r) => methodFilter.regions.includes(r.key))
    : config.regions;
  function getVisibleMethods(regionKey) {
    const all = config.methods[regionKey] || [];
    if (!methodFilter) return all;
    if (methodFilter.methodKeys) return all.filter((m) => methodFilter.methodKeys.includes(m.key));
    const perRegion = methodFilter.regionTypes?.[regionKey];
    if (perRegion) return all.filter((m) => perRegion.includes(m.type));
    if (methodFilter.types) return all.filter((m) => methodFilter.types.includes(m.type));
    return all;
  }

  // Flat sections with labels for the modal flat list
  const REGION_LABELS = { crypto: t("recharge.regionCrypto"), global: t("recharge.regionGlobal") };
  const flatSections = visibleRegions.reduce((acc, reg) => {
    const methods = getVisibleMethods(reg.key);
    if (!methods.length) return acc;
    const label = REGION_LABELS[reg.key] ?? reg.label;
    acc.push({ label, methods, regionKey: reg.key });
    return acc;
  }, []);
  const hasAnyMethod = visibleRegions.some((r) => getVisibleMethods(r.key).length > 0);

  // Keep USD equivalent only for the $50 minimum check
  const amountUSD = () => Number((Number(amount) / (currency.rate || 1)).toFixed(2));

  const toggleRegion = (key) => setExpandedRegions((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });

  const doCopyToast = async (text) => {
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); toast.success(t("common.copied")); return; }
    } catch (_) { }
    if (fbCopy(text)) toast.success(t("common.copied"));
  };

  const openPay = (m, regionKey) => {
    if (!amount || Number(amount) <= 0) return toast.error(t("recharge.setAmountFirst"));
    if (m.type === "usdt") { setUsdtMethod(m); return; }
    if (amountUSD() < 50) return toast.error(t("recharge.minMsg"));
    setActiveRegion(regionKey);
    setProof(null);
    setMethod(m);
  };

  const closeSheet = () => { setMethod(null); setAmount(""); setProof(null); };

  const confirmPaid = async () => {
    setSubmitting(true);
    try {
      let record;
      const rawAmount = Number(amount);
      if (method.type === "bank" && proof) {
        const form = new FormData();
        form.append("amount", rawAmount);
        form.append("currency", currency.code);
        form.append("method", method.name);
        form.append("region", activeRegion);
        form.append("proof", proof);
        record = await api.upload("/recharge", form);
      } else {
        record = await api.post("/recharge", { amount: rawAmount, currency: currency.code, method: method.name, region: activeRegion });
      }
      closeSheet();
      toast.success(t("recharge.reviewMsg"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const eInfo = method ? (EWALLET_INFO[method.key] ?? { number: "+00 00 000 0000", name: "GoMall Co." }) : null;
  const { paymentInfo } = config;

  return (
    <div className="space-y-4">
      {/* wallet balances — hidden when embedded in the cart recharge modal */}
      {!forceCurrencyCode && (
        <div className="card-dark p-4">
          <p className="text-[11px] text-ivory/40 uppercase tracking-widest mb-3">{t("profile.currency")}</p>
          {Object.keys(session?.wallets || {}).length === 0 ? (
            <p className="text-[14px] text-ivory/35">0.00 USD</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(session?.wallets || {}).map(([code, bal]) => (
                <div key={code} className="flex items-center justify-between bg-white/5 rounded-xl px-3 py-2">
                  <span className="text-[11px] font-semibold text-ivory/50">{code}</span>
                  <span className="text-[14px] font-bold gold-text">
                    {bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* amount input */}
      <div className="card-dark p-5">
        <p className="text-[12px] text-gold-300/80 tracking-wide uppercase mb-2">{t("recharge.amount")}</p>
        <div className="flex items-center gap-2">
          <span className="text-[22px] font-bold text-gold-400/70">{currency.symbol}</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
            placeholder="0.00"
            inputMode="decimal"
            className="flex-1 serif text-[32px] font-bold text-ivory placeholder:text-ivory/25 focus:outline-none bg-transparent"
          />
        </div>
      </div>

      {/* preset buttons — hidden when embedded in the cart recharge modal */}
      {!forceCurrencyCode && config.presets.length > 0 && (
        <div className="grid grid-cols-3 gap-2.5">
          {config.presets.map((v) => {
            const displayVal = Number((v * (currency.rate || 1)).toFixed(2));
            return (
              <button
                key={v}
                onClick={() => setAmount(String(displayVal))}
                className={`h-12 rounded-xl text-[14px] font-semibold transition ${Number(amount) === displayVal
                    ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900"
                    : "gold-hairline bg-white/5 text-ivory/80"
                  }`}
              >
                {fmt(v, true)}
              </button>
            );
          })}
        </div>
      )}

      {/* region accordions */}
      {forceCurrencyCode && !hasAnyMethod ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.04] px-5 py-6 text-center space-y-2">
          <Icon name="alert" size={28} className="text-ivory/30 mx-auto" />
          <p className="text-[13px] text-ivory/60 leading-relaxed">
            {t("recharge.noMethodsForCurrency").replace("{currency}", forceCurrencyCode)}
          </p>
        </div>
      ) : forceCurrencyCode ? (
        // Flat list with section headers — no accordion — when embedded in the cart modal
        <div className="space-y-3">
          {flatSections.map(({ label, methods, regionKey }) => (
            <div key={regionKey}>
              <p className="text-[10px] font-semibold text-ivory/40 uppercase tracking-widest px-1 mb-1.5">{label}</p>
              <div className="overflow-hidden rounded-xl border border-white/10">
                {methods.map((m) => (
                  <button
                    key={m.key}
                    onClick={() => openPay(m, regionKey)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.07] transition border-b border-white/[0.06] last:border-0"
                  >
                    <span className="w-10 h-10 rounded-xl gold-hairline bg-white/5 text-gold-300 flex items-center justify-center shrink-0">
                      <Icon name={m.icon} size={18} />
                    </span>
                    <div className="flex-1 text-left">
                      <div className="text-[13px] font-semibold text-ivory truncate max-w-[15ch]">{m.name}</div>
                      <div className="text-[11px] text-ivory/45">{m.range}</div>
                    </div>
                    <Icon name="chevronRight" size={15} className="text-gold-300/30 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Accordion — on the standalone /recharge page
        <div className="space-y-2">
          {visibleRegions.map((reg) => {
            const regMethods = getVisibleMethods(reg.key);
            if (!regMethods.length) return null;
            const isOpen = expandedRegions.has(reg.key);
            return (
              <div key={reg.key} className="overflow-hidden rounded-xl border border-white/10">
                <button
                  onClick={() => toggleRegion(reg.key)}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-white/[0.08] hover:bg-white/[0.12] transition"
                >
                  <span className="text-[14px] font-semibold text-ivory">{reg.label}</span>
                  <Icon
                    name="chevronRight"
                    size={16}
                    className={`text-gold-300/60 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="bg-black/20 border-t border-white/10">
                    {regMethods.map((m) => (
                      <button
                        key={m.key}
                        onClick={() => openPay(m, reg.key)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.07] transition border-b border-white/[0.06] last:border-0"
                      >
                        <span className="w-10 h-10 rounded-xl gold-hairline bg-white/5 text-gold-300 flex items-center justify-center shrink-0">
                          <Icon name={m.icon} size={18} />
                        </span>
                        <div className="flex-1 text-left">
                          <div className="text-[13px] font-semibold text-ivory truncate max-w-[15ch]">{m.name}</div>
                          <div className="text-[11px] text-ivory/45">{m.range}</div>
                        </div>
                        <Icon name="chevronRight" size={15} className="text-gold-300/30 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[12px] text-ivory/40 leading-relaxed whitespace-pre-line">
        {t("recharge.note")}
      </p>

      {/* USDT deposit sheet */}
      {usdtMethod && (
        <UsdtDepositSheet method={usdtMethod} onClose={() => setUsdtMethod(null)} />
      )}

      {/* Non-USDT pay sheet */}
      {method && (
        <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="card-dark chat-scrollbar p-5 w-full max-w-[400px] overflow-y-auto max-h-[90vh]" style={{ background: 'rgba(12, 10, 7, 0.92)' }}>
            <div className="flex items-center justify-between mb-1">
              <h3 className="serif text-[17px] font-semibold text-ivory">{method.name}</h3>
              <button onClick={() => setMethod(null)} className="w-8 h-8 flex items-center justify-center text-ivory/50">
                <Icon name="close" size={20} />
              </button>
            </div>
            <p className="text-[13px] text-ivory/50 mb-4">
              {t("recharge.amount")} · {currency.symbol}{amount}
              {currency.code !== "USD" && currency.code !== "USDT" && (
                <span className="ml-1 text-ivory/35">≈ ${amountUSD().toFixed(2)}</span>
              )}
            </p>

            {method.type === "qr" && (
              <div className="flex flex-col items-center">
                <div className="p-3 rounded-2xl bg-ivory gold-hairline">
                  <QRCodeSVG value={`demo_${method.key}_${amount}`} size={168} fgColor="#15110a" bgColor="#f8f4ea" />
                </div>
                <p className="text-[12px] text-ivory/50 mt-3 text-center">{t("recharge.scanToPay")}</p>
              </div>
            )}

            {method.type === "ewallet" && (
              <div className="rounded-xl bg-white/5 gold-hairline p-4 text-[14px] space-y-3 text-ivory">
                <div className="flex items-center justify-between">
                  <span className="text-ivory/50">{t("recharge.sendTo")}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{eInfo.number}</span>
                    <button onClick={() => doCopyToast(eInfo.number)} className="text-gold-300">
                      <Icon name="copy" size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-ivory/50">{t("recharge.accountName")}</span>
                  <span className="font-medium text-right max-w-[55%]">{eInfo.name}</span>
                </div>
              </div>
            )}

            {method.type === "bank" && (
              <>
                <div className="rounded-xl bg-white/5 gold-hairline p-4 text-[14px] space-y-2.5 text-ivory">
                  {paymentInfo.bankName && (
                    <div className="flex justify-between">
                      <span className="text-ivory/50">{t("recharge.bank")}</span>
                      <span className="font-medium">{paymentInfo.bankName}</span>
                    </div>
                  )}
                  {paymentInfo.bankAccount && (
                    <div className="flex justify-between">
                      <span className="text-ivory/50">{t("recharge.holder")}</span>
                      <span className="font-medium">{paymentInfo.bankAccount}</span>
                    </div>
                  )}
                  {paymentInfo.bankAccountNo && (
                    <div className="flex items-center justify-between">
                      <span className="text-ivory/50">{t("recharge.accountNo")}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium font-mono text-[13px]">{paymentInfo.bankAccountNo}</span>
                        <button onClick={() => doCopyToast(paymentInfo.bankAccountNo)} className="text-gold-300">
                          <Icon name="copy" size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                  {paymentInfo.bankSwift && (
                    <div className="flex justify-between">
                      <span className="text-ivory/50">SWIFT / BIC</span>
                      <span className="font-mono text-[13px]">{paymentInfo.bankSwift}</span>
                    </div>
                  )}
                  {paymentInfo.bankRouting && (
                    <div className="flex justify-between">
                      <span className="text-ivory/50">Routing No.</span>
                      <span className="font-mono text-[13px]">{paymentInfo.bankRouting}</span>
                    </div>
                  )}
                  {paymentInfo.bankBranch && (
                    <div className="flex justify-between">
                      <span className="text-ivory/50">Branch</span>
                      <span className="font-medium text-right max-w-[60%]">{paymentInfo.bankBranch}</span>
                    </div>
                  )}
                  {paymentInfo.bankExtra && (
                    <div className="pt-1 border-t border-white/10">
                      <p className="text-ivory/40 text-[12px] leading-relaxed">{paymentInfo.bankExtra}</p>
                    </div>
                  )}
                  {!paymentInfo.bankName && !paymentInfo.bankAccountNo && (
                    <p className="text-ivory/40 text-[13px] text-center py-2">Payment details not configured yet.</p>
                  )}
                </div>

                <div className="mt-4">
                  <p className="text-[12px] text-gold-300/70 mb-2">{t("recharge.uploadProof")}</p>
                  <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden"
                    onChange={(e) => setProof(e.target.files?.[0] ?? null)} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    className={`w-full h-[52px] rounded-xl gold-hairline flex items-center justify-center gap-2.5 text-[13px] font-medium transition ${proof ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-ivory/55"
                      }`}
                  >
                    <Icon name={proof ? "checkCircle" : "fileText"} size={16} />
                    <span className="truncate max-w-[220px]">
                      {proof ? proof.name : t("recharge.chooseFile")}
                    </span>
                  </button>
                </div>
              </>
            )}

            <div className="flex gap-3 mt-5">
              <button onClick={() => setMethod(null)} className="flex-1 h-[50px] rounded-2xl glass-dark gold-hairline text-ivory/70 hover:text-ivory font-semibold transition active:scale-95">
                {t("common.cancel")}
              </button>
              <button onClick={confirmPaid} disabled={submitting} className="btn-primary flex-1 h-[50px] disabled:opacity-60">
                {submitting ? t("common.loading") : t("recharge.paid")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
