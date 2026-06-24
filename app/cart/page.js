"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, getToken } from "@/lib/api";
import { refreshSession } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { useToast } from "@/components/Toast";
import { useSession } from "@/lib/store";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";
import RechargeContent from "@/components/RechargeContent";

const ADDR_FIELDS = [
  { key: "fullName",   labelKey: "cart.fieldFullName",   half: false },
  { key: "phone",      labelKey: "cart.fieldPhone",      half: false },
  { key: "address1",  labelKey: "cart.fieldAddress",    half: false },
  { key: "address2",  labelKey: "cart.fieldAptSuite",   half: false },
  { key: "city",      labelKey: "cart.fieldCity",       half: true  },
  { key: "state",     labelKey: "cart.fieldState",      half: true  },
  { key: "country",   labelKey: "cart.fieldCountry",    half: true  },
  { key: "postalCode",labelKey: "cart.fieldPostalCode", half: true  },
];

const EMPTY_ADDR = { fullName: "", phone: "", address1: "", address2: "", city: "", state: "", country: "", postalCode: "" };

function hasAddress(a) {
  return !!(a?.address1?.trim() && a?.city?.trim());
}

function AddressCard({ address, onEdit }) {
  const { t } = useI18n();
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-gold-400/12 flex items-center justify-center shrink-0 mt-0.5">
          <Icon name="mapPin" size={15} className="text-gold-300" />
        </div>
        <div>
          {address.fullName && <p className="text-[14px] font-semibold text-ivory">{address.fullName}</p>}
          {address.phone    && <p className="text-[12px] text-ivory/50 mt-0.5">{address.phone}</p>}
          <p className="text-[13px] text-ivory/70 leading-relaxed mt-1">
            {address.address1}
            {address.address2 && `, ${address.address2}`}<br />
            {[address.city, address.state].filter(Boolean).join(", ")}
            {address.postalCode && ` ${address.postalCode}`}
            {address.country && <><br />{address.country}</>}
          </p>
        </div>
      </div>
      <button
        onClick={onEdit}
        className="shrink-0 text-[12px] font-semibold text-gold-300 hover:text-gold-200 transition flex items-center gap-1"
      >
        <Icon name="edit" size={13} />
        {t("common.edit")}
      </button>
    </div>
  );
}

function AddressForm({ initial, onSave, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ ...EMPTY_ADDR, ...(initial || {}) });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  function set(k, v) { setForm((p) => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.address1.trim() || !form.city.trim()) {
      toast.error(t("cart.requireAddressCity"));
      return;
    }
    setSaving(true);
    try {
      await api.put("/user/profile-info", form);
      onSave(form);
    } catch {
      toast.error(t("cart.failedSaveAddress"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {ADDR_FIELDS.map((f) => (
          <div key={f.key} className={f.half ? "" : "col-span-2"}>
            <label className="block text-[10px] font-semibold text-ivory/40 uppercase tracking-widest mb-1">{t(f.labelKey)}</label>
            <input
              value={form[f.key]}
              onChange={(e) => set(f.key, e.target.value)}
              className="field-dark w-full"
              placeholder={t(f.labelKey)}
            />
          </div>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        {onCancel && (
          <button onClick={onCancel} className="flex-1 h-10 rounded-xl gold-hairline bg-white/5 text-ivory/70 text-[13px] font-semibold hover:bg-white/10 transition">
            {t("common.cancel")}
          </button>
        )}
        <button onClick={save} disabled={saving} className="flex-1 h-10 btn-primary rounded-xl text-[13px] font-semibold disabled:opacity-60">
          {saving ? t("common.saving") : t("cart.saveAddress")}
        </button>
      </div>
    </div>
  );
}

export default function CartPage() {
  const router  = useRouter();
  const { t }   = useI18n();
  const { currencies } = useCurrency();
  const session = useSession();
  const toast   = useToast();

  const [items,         setItems]         = useState([]);
  const [total,         setTotal]         = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [checkingOut,   setCheckingOut]   = useState(false);
  // Initialize to EMPTY_ADDR so AddressCard never receives null before the fetch completes
  const [address,       setAddress]       = useState(EMPTY_ADDR);
  const [editAddr,      setEditAddr]      = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [payCurrency,   setPayCurrency]   = useState("USD");
  const [showPayModal,  setShowPayModal]  = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && !getToken()) router.replace("/login");
  }, [router]);

  function loadCart() {
    api.get("/cart")
      .then((data) => {
        const list = data.items || [];
        setItems(list);
        setTotal(data.total || 0);
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: list.length } }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadCart();
    api.get("/user/profile-info").then((info) => {
      if (!info) { setAddress(EMPTY_ADDR); setEditAddr(true); return; }
      const a = {
        fullName:   info.fullName   || "",
        phone:      info.phone      || "",
        address1:   info.address1   || "",
        address2:   info.address2   || "",
        city:       info.city       || "",
        state:      info.state      || "",
        country:    info.country    || "",
        postalCode: info.postalCode || "",
      };
      setAddress(a);
      if (!hasAddress(a)) setEditAddr(true);
    }).catch(() => { setAddress(EMPTY_ADDR); setEditAddr(true); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateQty(item, qty) {
    try {
      if (qty < 1) await api.del(`/cart/${item.id}`);
      else         await api.patch(`/cart/${item.id}`, { qty });
      loadCart();
    } catch { /* ignore */ }
  }

  async function removeItem(item) {
    try { await api.del(`/cart/${item.id}`); loadCart(); } catch { /* ignore */ }
    finally { setConfirmRemove(null); }
  }

  const payRate        = currencies.find((c) => c.code === payCurrency)?.rate ?? 1;
  const payAmt         = total * payRate;
  const walletBal      = session?.wallets?.[payCurrency] ?? 0;
  const isInsufficient = walletBal < payAmt;
  const canCheckout    = items.length > 0 && hasAddress(address) && !editAddr;

  const walletOptions = currencies.map(({ code, label, rate }) => {
    const bal    = session?.wallets?.[code] ?? 0;
    const needed = total * (rate ?? 1);
    return { code, label: label || code, bal, needed, canPay: bal >= needed };
  });

  // Auto-close the recharge modal once the selected wallet has enough funds
  useEffect(() => {
    if (!showPayModal || payAmt <= 0) return;
    const bal = session?.wallets?.[payCurrency] ?? 0;
    if (bal >= payAmt) {
      setShowPayModal(false);
      toast.success(t("cart.balanceUpdated"));
    }
  }, [session?.wallets, showPayModal]); // eslint-disable-line react-hooks/exhaustive-deps

  function openCheckout() {
    if (!items.length || checkingOut) return;
    if (!hasAddress(address)) { toast.error(t("cart.addAddressFirst")); setEditAddr(true); return; }
    if (isInsufficient) { setShowPayModal(true); return; }
    doCheckout(payCurrency);
  }

  async function doCheckout(currency) {
    setCheckingOut(true);
    setShowPayModal(false);
    try {
      const { order } = await api.post("/cart/checkout", { payCurrency: currency });
      await refreshSession();
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: 0 } }));
      toast.success(t("cart.purchaseSuccess"));
      router.push(`/shipping/${order.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="luxe min-h-screen pb-16">
      <BackHeader dark title={t("cart.title")} />

      <div className="px-4 md:px-8 lg:px-12 pt-5 max-w-2xl lg:max-w-3xl mx-auto w-full space-y-4">

        {loading ? (
          <div className="text-center text-ivory/40 text-[13px] pt-10">{t("common.loading")}</div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16">
            <div className="w-16 h-16 rounded-3xl hero-accent flex items-center justify-center shadow-gold">
              <Icon name="bag" size={28} className="text-gold-300" />
            </div>
            <p className="text-ivory font-semibold mt-4">{t("cart.empty")}</p>
            <p className="text-ivory/50 text-[13px] mt-1 max-w-[260px]">{t("cart.emptyHint")}</p>
          </div>
        ) : (
          <>
            {/* ── Cart items ──────────────────────────────────────────────── */}
            <div className="space-y-2">
              {items.filter((item) => item.product).map((item) => {
                const lineInPayCurrency = item.lineTotal * payRate;
                return (
                  <div key={item.id} className="card-dark p-4 flex gap-3">
                    <LuxImage
                      src={item.product.image}
                      alt={item.product.brand}
                      className="w-16 h-16 rounded-xl shrink-0 gold-hairline"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-gold-300/80 text-[10px] tracking-[0.2em] uppercase">{item.product.brand}</div>
                          <p className="text-[13px] text-ivory/85 leading-snug line-clamp-2 mt-0.5">{item.product.title}</p>
                        </div>
                        <button
                          onClick={() => setConfirmRemove(item.id)}
                          className="text-ivory/25 hover:text-red-400/70 transition shrink-0"
                        >
                          <Icon name="close" size={16} />
                        </button>
                      </div>

                      {confirmRemove === item.id ? (
                        <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-red-500/8 border border-red-500/20 px-3 py-2.5">
                          <p className="text-[12px] text-ivory/70">{t("cart.confirmRemove")}</p>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setConfirmRemove(null)}
                              className="h-7 px-3 rounded-lg gold-hairline bg-white/5 text-[11px] font-semibold text-ivory/60 hover:text-ivory transition"
                            >
                              {t("common.cancel")}
                            </button>
                            <button
                              onClick={() => removeItem(item)}
                              className="h-7 px-3 rounded-lg bg-red-500/80 hover:bg-red-500 text-[11px] font-semibold text-white transition"
                            >
                              {t("cart.remove")}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateQty(item, item.qty - 1)}
                              disabled={item.qty <= 1}
                              className="w-7 h-7 rounded-full gold-hairline bg-white/5 text-ivory flex items-center justify-center active:scale-95 transition disabled:opacity-40 disabled:active:scale-100 disabled:cursor-not-allowed">
                              <Icon name="minus" size={12} />
                            </button>
                            <span className="serif text-[14px] font-bold text-ivory w-6 text-center">{item.qty}</span>
                            <button onClick={() => updateQty(item, item.qty + 1)}
                              className="w-7 h-7 rounded-full gold-hairline bg-white/5 text-ivory flex items-center justify-center active:scale-95 transition">
                              <Icon name="plus" size={12} />
                            </button>
                          </div>
                          <span className="text-[15px] font-bold gold-text tracking-tight">{fmtNative(lineInPayCurrency, payCurrency)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Delivery Address ────────────────────────────────────────── */}
            <div className="card-dark p-4">
              <p className="text-[11px] font-semibold text-ivory/40 uppercase tracking-[0.2em] mb-3">{t("cart.deliveryAddress")}</p>
              {editAddr ? (
                <AddressForm
                  initial={address}
                  onSave={(saved) => { setAddress(saved); setEditAddr(false); }}
                  onCancel={hasAddress(address) ? () => setEditAddr(false) : null}
                />
              ) : (
                <AddressCard address={address} onEdit={() => setEditAddr(true)} />
              )}
            </div>

            {/* ── Order summary + Purchase ────────────────────────────────── */}
            <div className="card-dark p-4 space-y-4">

              {/* Wallet selector */}
              {session && (
                <div>
                  <p className="text-[10px] font-semibold text-ivory/40 uppercase tracking-widest mb-2">{t("cart.payWith")}</p>
                  <div className="flex flex-wrap gap-2">
                    {walletOptions.map(({ code, label, bal, needed, canPay }) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => setPayCurrency(code)}
                        className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition ${
                          payCurrency === code
                            ? "border-gold-400/60 bg-gold-400/12 text-gold-300"
                            : "border-white/10 bg-white/5 text-ivory/60 hover:border-gold-400/30"
                        }`}
                      >
                        <span className="text-[11px] font-bold">{label}</span>
                        <span className="text-[10px] opacity-70">{t("cart.balance")}: {bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`text-[10px] mt-0.5 ${canPay ? "text-emerald-400" : "text-red-400/80"}`}>{t("cart.pay")}: {needed.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ivory/50">{t("cart.subtotal")} ({items.length})</span>
                <span className="font-semibold text-ivory">{fmtNative(payAmt, payCurrency)}</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ivory/50">{t("cart.shipping")}</span>
                <span className="text-emerald-400 font-semibold">{t("common.free")}</span>
              </div>
              <div className="h-px bg-gold-400/12" />
              <div className="flex items-center justify-between">
                <span className="text-[13px] text-ivory/60">{t("cart.total")}</span>
                <span className="text-[22px] font-bold gold-text tracking-tight">{fmtNative(payAmt, payCurrency)}</span>
              </div>
              {isInsufficient && (
                <p className="text-[12px] text-red-400/80 text-center">{t("cart.rechargePromptTitle")} · {payCurrency}</p>
              )}
              <button
                onClick={openCheckout}
                disabled={checkingOut || !canCheckout}
                className="btn-primary w-full h-[54px] flex items-center justify-center gap-2.5 text-[15px] font-semibold rounded-xl disabled:opacity-50"
              >
                <Icon name="bag" size={18} />
                {checkingOut ? t("common.loading") : t("cart.checkout")}
              </button>
              {!hasAddress(address) && !editAddr && (
                <p className="text-center text-[12px] text-red-400/80">{t("cart.addAddressFirst")}</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Recharge modal (shown when selected wallet has insufficient funds) ── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowPayModal(false)} />
          <div className="relative card-dark rounded-t-2xl sm:rounded-2xl w-full sm:max-w-xl max-h-[90vh] flex flex-col shadow-lux">
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-gold-400/15 shrink-0">
              <p className="text-[16px] font-bold text-ivory">{t("cart.rechargePromptTitle")}</p>
              <button
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-full bg-white/8 text-ivory/60 flex items-center justify-center hover:text-ivory transition shrink-0"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="overflow-y-auto overflow-x-hidden flex-1 px-6 py-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gold-400/25">
              <RechargeContent
                initialAmount={Math.max(0, payAmt - walletBal)}
                forceCurrencyCode={payCurrency}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
