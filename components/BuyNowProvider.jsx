"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useSession, refreshSession } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";
import RechargeContent from "@/components/RechargeContent";

// Global "Buy directly" flow — a single-item checkout that bypasses the cart.
// Any page can trigger it via useBuyNow()(product). The product must carry the
// fields returned by /listings (inventoryId, retail, stock, brand, title, image).
const BuyNowContext = createContext(() => {});

export function BuyNowProvider({ children }) {
  const router = useRouter();
  const { t } = useI18n();
  const { currency } = useCurrency();
  const session = useSession();
  const toast = useToast();

  const [target, setTarget] = useState(null);
  const [qty, setQtyState] = useState(1);
  const [busy, setBusy] = useState(false);
  const [recharge, setRecharge] = useState(false);

  function openBuyNow(product, initialQty = 1) {
    if (!product) return;
    if (!session) { router.push("/login"); return; }
    if ((product.stock ?? 0) < 1) { toast.error(t("buy.outOfStock")); return; }
    setTarget(product);
    setQtyState(Math.max(1, Math.min(product.stock ?? 1, Math.floor(initialQty) || 1)));
    setRecharge(false);
  }

  function close() {
    setTarget(null);
    setRecharge(false);
  }

  // p.retail is already in the active (header) currency; wallet balances are native.
  const unit  = target ? Number(target.retail) || 0 : 0;
  const total = unit * qty;
  const wallet = session?.wallets?.[currency.code] ?? 0;
  const short = Math.max(0, total - wallet);
  const insufficient = total > 0 && wallet < total;

  function setQty(next) {
    const max = target?.stock ?? 1;
    setQtyState(Math.max(1, Math.min(max, Math.floor(next) || 1)));
  }

  async function confirm() {
    if (!target || busy) return;
    if (insufficient) { setRecharge(true); return; }
    setBusy(true);
    try {
      const { order } = await api.post("/cart/buy-now", {
        inventoryId: target.inventoryId,
        qty,
        payCurrency: currency.code,
      });
      await refreshSession();
      toast.success(t("cart.purchaseSuccess"));
      close();
      router.push(`/shipping/${order.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setBusy(false);
    }
  }

  // Auto-close the recharge sheet once the active wallet can cover the purchase
  useEffect(() => {
    if (!recharge || total <= 0) return;
    if ((session?.wallets?.[currency.code] ?? 0) >= total) {
      setRecharge(false);
      toast.success(t("cart.balanceUpdated"));
    }
  }, [session?.wallets, recharge, total, currency.code]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <BuyNowContext.Provider value={openBuyNow}>
      {children}

      {/* ── Buy directly modal ──────────────────────────────────────── */}
      {target && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative card-dark rounded-2xl w-full max-w-md max-h-[92vh] flex flex-col shadow-lux" style={{ background: 'rgba(12, 10, 7, 0.92)' }}>
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gold-400/15 shrink-0">
              <p className="text-[15px] font-bold text-ivory">{t("buy.title")}</p>
              <button onClick={close} className="w-8 h-8 rounded-full bg-white/8 text-ivory/60 flex items-center justify-center hover:text-ivory transition shrink-0">
                <Icon name="close" size={16} />
              </button>
            </div>

            <div className="overflow-y-auto chat-scrollbar flex-1 px-5 py-4 space-y-4">
              {/* product */}
              <div className="flex gap-3">
                <LuxImage src={target.image} alt={target.brand} className="w-16 h-16 rounded-xl shrink-0 gold-hairline" />
                <div className="min-w-0">
                  <div className="text-gold-300/80 text-[10px] tracking-[0.2em] uppercase">{target.brand}</div>
                  <p className="text-[13px] text-ivory/85 leading-snug line-clamp-2 mt-0.5">{target.title}</p>
                  {target.shopName && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-ivory/40">
                      <Icon name="store" size={10} className="shrink-0" />
                      <span className="truncate">{target.shopName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* quantity */}
              <div>
                <p className="text-[10px] font-semibold text-ivory/40 uppercase tracking-widest mb-2">{t("buy.quantity")}</p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(qty - 1)} disabled={qty <= 1}
                      className="w-8 h-8 rounded-full gold-hairline bg-white/5 text-ivory flex items-center justify-center active:scale-95 transition disabled:opacity-40">
                      <Icon name="minus" size={13} />
                    </button>
                    <input
                      type="number" min={1} max={target.stock} value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                      className="field-dark w-16 text-center"
                    />
                    <button onClick={() => setQty(qty + 1)} disabled={qty >= (target.stock ?? 1)}
                      className="w-8 h-8 rounded-full gold-hairline bg-white/5 text-ivory flex items-center justify-center active:scale-95 transition disabled:opacity-40">
                      <Icon name="plus" size={13} />
                    </button>
                  </div>
                  <span className="text-[11px] text-ivory/40">{t("buy.inStock", { n: target.stock })}</span>
                </div>
              </div>

              {/* price + balance summary */}
              <div className="rounded-xl bg-white/[0.04] gold-hairline p-4 space-y-2">
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-ivory/50">{t("buy.unitPrice")}</span>
                  <span className="text-ivory/80">{fmtNative(unit, currency.code)}</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-ivory/50">{t("cart.balance")} · {currency.code}</span>
                  <span className={insufficient ? "text-red-400/80" : "text-emerald-400"}>{fmtNative(wallet, currency.code)}</span>
                </div>
                <div className="h-px bg-gold-400/12" />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-ivory/60">{t("cart.total")}</span>
                  <span className="text-[20px] font-bold gold-text tracking-tight">{fmtNative(total, currency.code)}</span>
                </div>
                {insufficient && (
                  <p className="text-[11px] text-red-400/80 text-center pt-0.5">{t("buy.insufficient", { amount: fmtNative(short, currency.code) })}</p>
                )}
              </div>

              <button
                onClick={confirm}
                disabled={busy}
                className="btn-primary w-full h-[50px] flex items-center justify-center gap-2 text-[15px] font-semibold rounded-xl disabled:opacity-60"
              >
                <Icon name={insufficient ? "deposit" : "zap"} size={17} />
                {busy ? t("common.loading") : insufficient ? t("buy.recharge") : t("buy.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Recharge sheet (active wallet has insufficient funds) ── */}
      {target && recharge && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative card-dark rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-lux" style={{ background: 'rgba(12, 10, 7, 0.92)' }}>
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gold-400/15 shrink-0">
              <p className="text-[16px] font-bold text-ivory">{t("cart.rechargePromptTitle")}</p>
              <button onClick={() => setRecharge(false)} className="w-8 h-8 rounded-full bg-white/8 text-ivory/60 flex items-center justify-center hover:text-ivory transition shrink-0">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="overflow-y-auto overflow-x-hidden flex-1 px-6 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gold-400/25">
              <RechargeContent initialAmount={short} forceCurrencyCode={currency.code} />
            </div>
          </div>
        </div>
      )}
    </BuyNowContext.Provider>
  );
}

export function useBuyNow() {
  return useContext(BuyNowContext);
}
