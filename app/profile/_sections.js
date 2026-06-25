"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useToast } from "@/components/Toast";
import { useSession, refreshSession } from "@/lib/store";
import { api, ApiError, fileUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { LANGUAGES } from "@/lib/data";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";
import Pagination from "@/components/Pagination";
import RechargeContent from "@/components/RechargeContent";
import ShippingList from "@/components/ShippingList";
import SaleBadge from "@/components/SaleBadge";

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar definition — slug="" means the item lives at /profile (root)
// ─────────────────────────────────────────────────────────────────────────────
export const SIDEBAR = [
  { type: "section", labelKey: "profile.section.myAccount" },
  { key: "overview",     slug: "",              icon: "user",     labelKey: "profile.menu.profile"      },
  { key: "likes",        slug: "likes",          icon: "heart",    labelKey: "profile.menu.likes"        },
  { key: "shippingInfo", slug: "shipping-info",  icon: "mapPin",   labelKey: "profile.menu.shippingInfo" },
  { key: "kyc",          slug: "kyc",            icon: "idCard",   labelKey: "profile.menu.kyc"          },
  { key: "myShop",       slug: "my-shop",        icon: "store",    labelKey: "profile.menu.myShop"       },
  { type: "section", labelKey: "profile.section.settings" },
  { key: "invite",   slug: "invite",    icon: "users",    labelKey: "profile.menu.invite"   },
  { key: "language", slug: "language",  icon: "globe",    labelKey: "profile.menu.language" },
  { type: "section", labelKey: "profile.section.walletFinance" },
  { key: "recharge", slug: "recharge",  icon: "deposit",  labelKey: "profile.menu.recharge" },
  { key: "withdraw", slug: "withdraw",  icon: "withdraw", labelKey: "profile.menu.withdraw" },
  { key: "history",  slug: "history",   icon: "receipt",  labelKey: "profile.menu.history"  },
];

export const NAV_ITEMS = SIDEBAR.filter((s) => !s.type);

// ─────────────────────────────────────────────────────────────────────────────
// Shared section wrapper
// ─────────────────────────────────────────────────────────────────────────────
export function SectionWrap({ title, icon, children, narrow }) {
  return (
    <div className="px-6 lg:px-10 py-8 space-y-6">
      <div className={`flex items-center gap-3 pb-4 border-b border-gold-400/10 ${narrow ? "max-w-2xl" : ""}`}>
        <div className="w-10 h-10 rounded-xl gold-hairline bg-gold-400/12 text-gold-300 flex items-center justify-center">
          <Icon name={icon} size={18} />
        </div>
        <h2 className="serif text-[22px] font-bold text-ivory">{title}</h2>
      </div>
      {narrow ? <div className="max-w-2xl space-y-6">{children}</div> : children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Overview / Profile
// ─────────────────────────────────────────────────────────────────────────────
export function OverviewSection({ session }) {
  const { t }       = useI18n();
  const customToast = useToast();
  const fileRef     = useRef(null);

  const [form,    setForm]    = useState({ fullName: "", email: "", birthday: "", avatar: "", phone: "", address1: "", address2: "", city: "", state: "", country: "", postalCode: "" });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    api.get("/user/profile-info")
      .then((d) => setForm((f) => ({ ...f, ...d })))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const SIZE = 160;
        canvas.width = canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        const s = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, SIZE, SIZE);
        setForm((f) => ({ ...f, avatar: canvas.toDataURL("image/jpeg", 0.82) }));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.put("/user/profile-info", form);
      await refreshSession();
      customToast.success(t("profile.saved"));
    } catch (err) {
      customToast.error(err?.message || t("common.loadFailed"));
    } finally {
      setSaving(false);
    }
  }

  const initials = (form.fullName || session?.account || "").slice(0, 2).toUpperCase() || "GM";

  return (
    <SectionWrap title={t("profile.menu.profile")} icon="user">
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-gold-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="max-w-md space-y-7">
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center ring-2 ring-gold-400/25">
                {form.avatar ? (
                  <img src={form.avatar} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="serif text-[30px] font-bold text-ink-900 select-none">{initials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-gold-500 hover:bg-gold-400 text-ink-900 flex items-center justify-center shadow-md transition"
                title={t("profile.uploadAvatar")}
              >
                <Icon name="edit" size={12} />
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </div>
            <div className="text-center">
              <p className="text-[16px] font-bold text-ivory">{session?.account}</p>
              {session?.vip > 0 && (
                <span className="inline-flex items-center gap-1 mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-gold-300 bg-gold-400/15 border border-gold-400/25">
                  <Icon name="crown" size={10} /> VIP {session.vip}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-4">
            {[
              { key: "fullName", label: t("profile.fullName"),  placeholder: t("profile.fullNamePlaceholder"), type: "text"  },
              { key: "email",    label: t("profile.email"),     placeholder: t("profile.emailPlaceholder"),    type: "email" },
              { key: "birthday", label: t("profile.birthday"),  placeholder: "",                               type: "date"  },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key}>
                <label className="text-[11px] font-semibold text-gold-300/70 uppercase tracking-widest block mb-1.5">{label}</label>
                <input
                  type={type}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full bg-[#1c1610] border border-gold-400/20 rounded-xl px-4 h-11 text-[14px] text-ivory placeholder-ivory/30 outline-none focus:border-gold-400/50 transition"
                  style={type === "date" ? { colorScheme: "dark" } : undefined}
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full btn-primary h-12 text-[14px] font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? <><div className="w-4 h-4 border-2 border-ink-900 border-t-transparent rounded-full animate-spin" />{t("common.saving")}</> : t("common.save")}
          </button>
        </div>
      )}
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart
// ─────────────────────────────────────────────────────────────────────────────
const CART_ADDR_FIELDS = [
  { key: "fullName",    labelKey: "cart.fieldFullName",   half: false },
  { key: "phone",       labelKey: "cart.fieldPhone",      half: false },
  { key: "address1",   labelKey: "cart.fieldAddress",    half: false },
  { key: "address2",   labelKey: "cart.fieldAptSuite",   half: false },
  { key: "city",       labelKey: "cart.fieldCity",       half: true  },
  { key: "state",      labelKey: "cart.fieldState",      half: true  },
  { key: "country",    labelKey: "cart.fieldCountry",    half: true  },
  { key: "postalCode", labelKey: "cart.fieldPostalCode", half: true  },
];
const CART_EMPTY_ADDR = { fullName: "", phone: "", address1: "", address2: "", city: "", state: "", country: "", postalCode: "" };
function cartHasAddress(a) { return !!(a?.address1?.trim() && a?.city?.trim()); }

function CartAddressCard({ address, onEdit }) {
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
      <button onClick={onEdit} className="shrink-0 text-[12px] font-semibold text-gold-300 hover:text-gold-200 transition flex items-center gap-1">
        <Icon name="edit" size={13} />
        {t("common.edit")}
      </button>
    </div>
  );
}

function CartAddressForm({ initial, onSave, onCancel }) {
  const { t } = useI18n();
  const [form, setForm] = useState({ ...CART_EMPTY_ADDR, ...initial });
  const [saving, setSaving] = useState(false);

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
        {CART_ADDR_FIELDS.map((f) => (
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

export function CartSection({ onCountChange }) {
  const router              = useRouter();
  const { t }               = useI18n();
  const { currencies }      = useCurrency();
  const session             = useSession();

  const [items,           setItems]           = useState([]);
  const [total,           setTotal]           = useState(0);
  const [loading,         setLoading]         = useState(true);
  const [checkingOut,     setCheckingOut]     = useState(false);
  const [address,         setAddress]         = useState(null);
  const [editAddr,        setEditAddr]        = useState(false);
  const [confirmRemove,   setConfirmRemove]   = useState(null);
  const [payCurrency,     setPayCurrency]     = useState("USD");
  const [showPayModal,    setShowPayModal]    = useState(false);

  function load() {
    api.get("/cart").then((d) => {
      const list = d.items || [];
      setItems(list);
      setTotal(d.total || 0);
      onCountChange?.(list.length);
    }).catch(() => {}).finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
    api.get("/user/profile-info").then((info) => {
      if (!info) { setAddress(CART_EMPTY_ADDR); setEditAddr(true); return; }
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
      if (!cartHasAddress(a)) setEditAddr(true);
    }).catch(() => { setAddress(CART_EMPTY_ADDR); setEditAddr(true); });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function updateQty(item, qty) {
    try {
      qty < 1 ? await api.del(`/cart/${item.id}`) : await api.patch(`/cart/${item.id}`, { qty });
      load();
    } catch {}
  }

  async function removeItem(item) {
    try { await api.del(`/cart/${item.id}`); load(); } catch {}
    finally { setConfirmRemove(null); }
  }

  const payRate        = currencies.find((c) => c.code === payCurrency)?.rate ?? 1;
  const payAmt         = total * payRate;
  const walletBal      = session?.wallets?.[payCurrency] ?? 0;
  const isInsufficient = walletBal < payAmt;
  const canCheckout    = items.length > 0 && cartHasAddress(address) && !editAddr;

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
    if (!cartHasAddress(address)) { toast.error(t("cart.addAddressFirst")); setEditAddr(true); return; }
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
    } finally { setCheckingOut(false); }
  }

  return (
    <>
    <SectionWrap title={t("profile.menu.cart")} icon="bag">
      {loading ? (
        <div className="text-center text-ivory/40 py-12">{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl hero-accent flex items-center justify-center mb-4">
            <Icon name="bag" size={28} className="text-gold-300" />
          </div>
          <p className="text-ivory font-semibold">{t("cart.empty")}</p>
          <p className="text-ivory/45 text-[13px] mt-1">{t("cart.emptyHint")}</p>
          <Link href="/products" className="btn-primary mt-5 h-10 px-6 flex items-center text-[13px]">{t("common.browseProducts")}</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            {items.filter((item) => item.product).map((item) => {
              const lineInPayCurrency = item.lineTotal * payRate;
              return (
                <div key={item.id} className="card-dark p-4 flex gap-3">
                  <LuxImage src={item.product.image} alt={item.product.brand} className="w-16 h-16 rounded-xl shrink-0 gold-hairline" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-gold-300/80 text-[10px] tracking-[0.2em] uppercase">{item.product.brand}</div>
                        <p className="text-[13px] text-ivory/85 leading-snug line-clamp-2 mt-0.5">{item.product.title}</p>
                      </div>
                      <button onClick={() => setConfirmRemove(item.id)} className="text-ivory/25 hover:text-red-400/70 transition shrink-0">
                        <Icon name="close" size={16} />
                      </button>
                    </div>
                    {confirmRemove === item.id ? (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-red-500/8 border border-red-500/20 px-3 py-2.5">
                        <p className="text-[12px] text-ivory/70">{t("cart.confirmRemove")}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button onClick={() => setConfirmRemove(null)} className="h-7 px-3 rounded-lg gold-hairline bg-white/5 text-[11px] font-semibold text-ivory/60 hover:text-ivory transition">{t("common.cancel")}</button>
                          <button onClick={() => removeItem(item)} className="h-7 px-3 rounded-lg bg-red-500/80 hover:bg-red-500 text-[11px] font-semibold text-white transition">{t("cart.remove")}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQty(item, item.qty - 1)} className="w-7 h-7 rounded-full gold-hairline bg-white/5 text-ivory flex items-center justify-center active:scale-95 transition"><Icon name="minus" size={12} /></button>
                          <span className="serif text-[14px] font-bold text-ivory w-6 text-center">{item.qty}</span>
                          <button onClick={() => updateQty(item, item.qty + 1)} className="w-7 h-7 rounded-full gold-hairline bg-white/5 text-ivory flex items-center justify-center active:scale-95 transition"><Icon name="plus" size={12} /></button>
                        </div>
                        <span className="text-[15px] font-bold gold-text tracking-tight">{fmtNative(lineInPayCurrency, payCurrency)}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="card-dark p-4">
            <p className="text-[11px] font-semibold text-ivory/40 uppercase tracking-[0.2em] mb-3">{t("cart.deliveryAddress")}</p>
            {editAddr ? (
              <CartAddressForm initial={address} onSave={(saved) => { setAddress(saved); setEditAddr(false); }} onCancel={cartHasAddress(address) ? () => setEditAddr(false) : null} />
            ) : (
              <CartAddressCard address={address} onEdit={() => setEditAddr(true)} />
            )}
          </div>
          <div className="card-dark p-4 space-y-4">
            {session && Object.keys(session.wallets || {}).length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-ivory/40 uppercase tracking-widest mb-2">{t("cart.payWith")}</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(session.wallets).map(([code, bal]) => {
                    const rate   = currencies.find((c) => c.code === code)?.rate ?? 1;
                    const needed = (total * rate).toFixed(2);
                    const enough = bal >= total * rate;
                    return (
                      <button key={code} type="button" onClick={() => setPayCurrency(code)}
                        className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition ${payCurrency === code ? "border-gold-400/60 bg-gold-400/12 text-gold-300" : "border-white/10 bg-white/5 text-ivory/60 hover:border-gold-400/30"}`}>
                        <span className="text-[11px] font-bold">{code}</span>
                        <span className="text-[10px] opacity-70">{t("cart.balance")}: {bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`text-[10px] mt-0.5 ${enough ? "text-emerald-400" : "text-red-400/80"}`}>{t("cart.pay")}: {needed}</span>
                      </button>
                    );
                  })}
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
            <button onClick={openCheckout} disabled={checkingOut || !canCheckout} className="btn-primary w-full h-[54px] flex items-center justify-center gap-2.5 text-[15px] font-semibold rounded-xl disabled:opacity-50">
              <Icon name="bag" size={18} />
              {checkingOut ? t("common.loading") : t("cart.checkout")}
            </button>
            {!cartHasAddress(address) && !editAddr && (
              <p className="text-center text-[12px] text-red-400/80">{t("cart.addAddressFirst")}</p>
            )}
          </div>
        </div>
      )}
    </SectionWrap>

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
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Liked Products
// ─────────────────────────────────────────────────────────────────────────────
export function LikesSection() {
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
  useEffect(() => { load(); }, [currency.code]); // eslint-disable-line react-hooks/exhaustive-deps

  async function unlike(productId, e) {
    e.stopPropagation();
    await api.post(`/likes/${productId}`).catch(() => {});
    setItems((prev) => prev.filter((p) => p.id !== productId));
  }

  return (
    <SectionWrap title={t("likes.title")} icon="heart">
      {loading ? (
        <div className="text-center text-ivory/40 py-12">{t("common.loading")}</div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl hero-accent flex items-center justify-center mb-4"><Icon name="heart" size={28} className="text-gold-300" /></div>
          <p className="text-ivory font-semibold">{t("likes.empty")}</p>
          <p className="text-ivory/45 text-[13px] mt-1">{t("likes.emptyHint")}</p>
          <Link href="/products" className="btn-primary mt-5 h-10 px-6 flex items-center text-[13px]">{t("common.browseProducts")}</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {items.map((p) => (
            <button key={p.id} onClick={() => router.push(`/product/${p.id}`)} className="card-dark overflow-hidden text-left group hover:border-gold-400/50 transition">
              <div className="relative overflow-hidden">
                <LuxImage src={p.image} alt={p.brand} className="aspect-[4/5] group-hover:scale-105 transition-transform duration-500" label={p.brand} />
                <button onClick={(e) => unlike(p.id, e)} className="absolute top-2 right-2 w-8 h-8 rounded-full glass-dark gold-hairline text-red-400 flex items-center justify-center hover:scale-110 transition-transform">
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
            </button>
          ))}
        </div>
      )}
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Orders
// ─────────────────────────────────────────────────────────────────────────────
export function ShippingSection() {
  const { t }   = useI18n();
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/shipping").then((d) => setList(d.items || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <SectionWrap title={t("profile.menu.shipping")} icon="truck">
      {loading ? (
        <div className="text-center text-ivory/40 py-12">{t("common.loading")}</div>
      ) : list.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <div className="w-16 h-16 rounded-3xl hero-accent flex items-center justify-center mb-4"><Icon name="truck" size={28} className="text-gold-300" /></div>
          <p className="text-ivory font-semibold">{t("shipping.empty")}</p>
          <p className="text-ivory/45 text-[13px] mt-1">{t("shipping.emptyHint")}</p>
        </div>
      ) : (
        <ShippingList list={list} />
      )}
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shipping Info (delivery address)
// ─────────────────────────────────────────────────────────────────────────────
export function ShippingInfoSection() {
  const { t }        = useI18n();
  const customToast  = useToast();
  const [form, setForm] = useState({ fullName: "", phone: "", email: "", address1: "", address2: "", city: "", state: "", country: "", postalCode: "" });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);

  useEffect(() => {
    api.get("/user/profile-info").then((d) => setForm((f) => ({ ...f, ...d }))).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      await api.put("/user/profile-info", form);
      customToast.success(t("shippingInfo.saved"));
    } catch (err) {
      customToast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally { setSaving(false); }
  };

  const FIELDS = [
    { key: "fullName",   labelKey: "shippingInfo.fullName",   half: false },
    { key: "phone",      labelKey: "shippingInfo.phone",      half: true  },
    { key: "email",      labelKey: "shippingInfo.email",      half: true  },
    { key: "address1",   labelKey: "shippingInfo.address1",   half: false },
    { key: "address2",   labelKey: "shippingInfo.address2",   half: false },
    { key: "city",       labelKey: "shippingInfo.city",       half: true  },
    { key: "postalCode", labelKey: "shippingInfo.postalCode", half: true  },
    { key: "state",      labelKey: "shippingInfo.state",      half: true  },
    { key: "country",    labelKey: "shippingInfo.country",    half: true  },
  ];

  return (
    <SectionWrap title={t("shippingInfo.title")} icon="mapPin">
      {loading ? (
        <div className="text-center text-ivory/40 py-12">{t("common.loading")}</div>
      ) : (
        <div className="max-w-lg space-y-4">
          <p className="text-[13px] text-ivory/50 leading-relaxed">{t("shippingInfo.hint")}</p>
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map(({ key, labelKey, half }) => (
              <div key={key} className={half ? "" : "col-span-2"}>
                <label className="text-[11px] font-semibold text-gold-300/70 uppercase tracking-widest block mb-1.5">{t(labelKey)}</label>
                <input value={form[key]} onChange={set(key)} className="field-dark w-full" />
              </div>
            ))}
          </div>
          <button onClick={save} disabled={saving} className="btn-primary w-full h-12 text-[14px] flex items-center justify-center gap-2 disabled:opacity-60">
            <Icon name="check" size={16} />
            {saving ? t("common.loading") : t("shippingInfo.save")}
          </button>
        </div>
      )}
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invite
// ─────────────────────────────────────────────────────────────────────────────
export function InviteSection() {
  const { t }  = useI18n();
  const { fmt } = useCurrency();
  const [data, setData] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => { api.get("/invite").then(setData).catch(() => {}); }, []);

  const copy = (text, setter) => {
    const done = () => { toast.success(t("invite.copied")); setter(true); setTimeout(() => setter(false), 2000); };
    if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).then(done).catch(() => {});
    else { const el = Object.assign(document.createElement("textarea"), { value: text, style: "position:fixed;opacity:0" }); document.body.appendChild(el); el.select(); try { document.execCommand("copy"); done(); } catch {} document.body.removeChild(el); }
  };

  return (
    <SectionWrap title={t("invite.title")} icon="users" narrow>
      {!data ? <div className="text-center text-ivory/40 py-8">{t("common.loading")}</div> : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: t("invite.totalInvited"), value: data.stats?.totalInvited ?? 0,        color: "text-ivory"        },
              { label: t("invite.activeUsers"),  value: data.stats?.activeUsers   ?? 0,        color: "text-emerald-400" },
              { label: t("invite.bonusEarned"),  value: fmt(data.stats?.bonusEarned ?? 0),     color: "text-gold-300"    },
            ].map((s) => (
              <div key={s.label} className="card-dark p-4 text-center">
                <div className={`text-[20px] font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-ivory/40 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="card-dark p-4">
            <p className="text-[11px] text-ivory/40 uppercase tracking-widest mb-2">{t("invite.yourCode")}</p>
            <div className="flex items-center gap-3">
              <span className="serif text-[22px] font-bold gold-text tracking-widest flex-1">{data.code}</span>
              <button onClick={() => copy(data.code, setCodeCopied)}
                className={`h-9 px-4 text-[12px] flex items-center gap-1.5 rounded-xl border transition-all ${codeCopied ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "gold-hairline bg-white/5 text-ivory/70 hover:text-gold-300 hover:border-gold-400/40"}`}>
                <Icon name={codeCopied ? "check" : "copy"} size={14} />
                {codeCopied ? t("invite.copied") : t("invite.copyCode")}
              </button>
            </div>
          </div>
          <div className="card-dark p-4">
            <p className="text-[11px] text-ivory/40 uppercase tracking-widest mb-2">{t("invite.shareLink")}</p>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-ivory/60 flex-1 truncate">gomall.vip/r/{data.code}</span>
              <button onClick={() => copy(`https://gomall.vip/r/${data.code}`, setLinkCopied)}
                className={`h-9 px-4 text-[12px] flex items-center gap-1.5 rounded-xl border transition-all ${linkCopied ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "gold-hairline bg-white/5 text-ivory/70 hover:text-gold-300 hover:border-gold-400/40"}`}>
                <Icon name={linkCopied ? "check" : "link"} size={14} />
                {linkCopied ? t("invite.copied") : t("invite.copyLink")}
              </button>
            </div>
          </div>
          {(data.invitedUsers || []).length > 0 && (
            <div className="card-dark overflow-hidden divide-y divide-gold-400/10">
              <p className="text-[11px] text-ivory/40 uppercase tracking-widest px-4 py-3">{t("invite.invitedUsers")}</p>
              {data.invitedUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold-300/40 to-gold-600/30 flex items-center justify-center text-[11px] font-bold text-gold-300">{u.account?.slice(-2) || "??"}</div>
                    <div>
                      <p className="text-[13px] text-ivory/80">{u.account}</p>
                      <p className="text-[11px] text-ivory/35">{new Date(u.joinedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`pill text-[10px] ${u.active ? "pill-success" : "pill-muted"}`}>{u.active ? "Active" : "Inactive"}</span>
                    {u.bonus > 0 && <p className="text-[11px] text-gold-300 mt-1">+{fmt(u.bonus)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Language
// ─────────────────────────────────────────────────────────────────────────────
export function LanguageSection() {
  const { t, lang, setLang } = useI18n();
  return (
    <SectionWrap title={t("language.title")} icon="globe">
      <div className="card-dark overflow-hidden divide-y divide-gold-400/10 max-w-sm">
        {LANGUAGES.map((l) => (
          <button key={l.code} onClick={() => { setLang(l.code); toast.success(t("language.changed")); }}
            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition">
            <span className="w-9 h-9 rounded-xl gold-hairline bg-gold-400/12 text-gold-300 flex items-center justify-center text-[11px] font-semibold uppercase">{l.code}</span>
            <span className="flex-1 text-left text-[14px] text-ivory/85">{l.label}</span>
            {lang === l.code && <Icon name="check" size={18} className="text-gold-300" />}
          </button>
        ))}
      </div>
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Recharge
// ─────────────────────────────────────────────────────────────────────────────
export function RechargeSection() {
  const { t } = useI18n();
  return (
    <SectionWrap title={t("recharge.title")} icon="deposit" narrow>
      <RechargeContent />
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Withdraw
// ─────────────────────────────────────────────────────────────────────────────
const FEE_RATE = 0.01;
const MIN_AMT  = 50;

export function WithdrawSection() {
  const session  = useSession();
  const { t }    = useI18n();
  const wallet   = session?.wallet  ?? null;
  const wallets  = session?.wallets || {};
  const walletCodes = Object.keys(wallets);

  const [withdrawCurrency, setWithdrawCurrency] = useState(() => {
    if (walletCodes.includes("USD")) return "USD";
    return walletCodes[0] || "USD";
  });
  const balance = wallets[withdrawCurrency] ?? 0;
  const [amount,     setAmount]     = useState("");
  const [sheet,      setSheet]      = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const num = Number(amount) || 0;
  const fee = Number((num * FEE_RATE).toFixed(2));
  const net = Number((num - fee).toFixed(2));

  const openSheet = () => {
    if (!wallet)               return toast.error(t("withdraw.noWallet"));
    if (!num || num < MIN_AMT) return toast.error(t("withdraw.minMsg"));
    if (num > balance)         return toast.error(t("withdraw.insufficient"));
    setSheet(true);
  };
  const confirm = async () => {
    setSubmitting(true);
    try {
      await api.post("/withdraw", { amount: num, currency: withdrawCurrency });
      await refreshSession();
      setSheet(false); setAmount("");
      toast.success(t("withdraw.submittedMsg"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally { setSubmitting(false); }
  };

  return (
    <SectionWrap title={t("withdraw.title")} icon="withdraw" narrow>
      <div className="max-w-md space-y-4">
        {walletCodes.length > 1 && (
          <div>
            <p className="text-[11px] font-semibold text-ivory/35 uppercase tracking-widest mb-2">{t("withdraw.withdrawFrom") || "Withdraw From"}</p>
            <div className="flex flex-wrap gap-2">
              {walletCodes.map((code) => {
                const bal = wallets[code] ?? 0;
                return (
                  <button key={code} type="button" onClick={() => { setWithdrawCurrency(code); setAmount(""); }}
                    className={`flex flex-col items-start px-3 py-2 rounded-xl border text-left transition ${withdrawCurrency === code ? "border-gold-400/60 bg-gold-400/12 text-gold-300" : "border-white/10 bg-white/5 text-ivory/60 hover:border-gold-400/30"}`}>
                    <span className="text-[11px] font-bold">{code}</span>
                    <span className="text-[10px] opacity-70">{bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        <div className="hero-accent rounded-2xl p-5 relative overflow-hidden">
          <div className="orb animate-orb w-32 h-32 bg-gold-400/25 -top-10 -right-6" />
          <p className="text-[11px] text-gold-300/80 uppercase tracking-widest mb-1">{t("withdraw.available")}</p>
          <p className="text-[28px] font-bold gold-text tracking-tight">
            {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            <span className="text-[16px] ml-1.5 opacity-60">{withdrawCurrency}</span>
          </p>
        </div>
        {wallet ? (
          <div className="card-dark p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gold-hairline bg-gold-400/15 flex items-center justify-center"><Icon name="coins" size={18} className="text-gold-300" /></div>
            <div>
              <p className="text-[13px] font-semibold text-ivory">{wallet.type}</p>
              <p className="text-[11px] text-ivory/40 font-mono">{wallet.address?.slice(0, 8)}···{wallet.address?.slice(-6)}</p>
            </div>
          </div>
        ) : (
          <div className="card-dark p-4 text-center text-[13px] text-ivory/50">{t("withdraw.noWallet")}</div>
        )}
        <div className="space-y-3">
          <label className="text-[11px] font-semibold text-gold-300/70 uppercase tracking-widest block">{t("withdraw.amount")} · {withdrawCurrency}</label>
          <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} type="text" inputMode="decimal" placeholder="0.00" className="field-dark w-full" />
          <div className="grid grid-cols-4 gap-2">
            {[0.25, 0.5, 0.75, 1].map((pct) => (
              <button key={pct} onClick={() => setAmount(String(Number((balance * pct).toFixed(2))))}
                className="gold-hairline bg-white/5 text-ivory/70 hover:text-gold-300 text-[12px] font-semibold h-9 rounded-xl transition">
                {pct === 1 ? t("common.max") : `${pct * 100}%`}
              </button>
            ))}
          </div>
          {num > 0 && (
            <div className="card-dark p-4 space-y-2 text-[13px]">
              <div className="flex justify-between text-ivory/50"><span>{t("withdraw.amountLabel")}</span><span className="text-ivory">{num.toFixed(2)} {withdrawCurrency}</span></div>
              <div className="flex justify-between text-ivory/50"><span>{t("withdraw.feeLabel")}</span><span className="text-red-400">−{fee.toFixed(2)} {withdrawCurrency}</span></div>
              <div className="flex justify-between border-t border-gold-400/15 pt-2 font-bold"><span className="text-ivory/70">{t("withdraw.youReceive")}</span><span className="gold-text">{net.toFixed(2)} {withdrawCurrency}</span></div>
            </div>
          )}
          <button onClick={openSheet} className="btn-primary w-full h-12 text-[14px] flex items-center justify-center gap-2">
            <Icon name="withdraw" size={16} /> {t("withdraw.submit")}
          </button>
        </div>
      </div>
      {sheet && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center px-4 pb-6">
          <div className="card-dark p-5 w-full max-w-[400px] animate-sheet space-y-4">
            <h3 className="serif text-[17px] font-semibold text-ivory">{t("withdraw.confirmTitle")}</h3>
            <div className="space-y-2 text-[14px]">
              <div className="flex justify-between text-ivory/50"><span>{t("withdraw.withdrawLabel")}</span><span className="text-ivory">{num.toFixed(2)} {withdrawCurrency}</span></div>
              <div className="flex justify-between text-ivory/50"><span>{t("withdraw.feeShort")}</span><span className="text-red-400">−{fee.toFixed(2)} {withdrawCurrency}</span></div>
              <div className="flex justify-between font-bold border-t border-gold-400/15 pt-2"><span className="text-ivory/70">{t("withdraw.net")}</span><span className="gold-text text-[17px]">{net.toFixed(2)} {withdrawCurrency}</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setSheet(false)} className="btn-ghost flex-1 h-11">{t("common.cancel")}</button>
              <button onClick={confirm} disabled={submitting} className="btn-primary flex-1 h-11 disabled:opacity-60">{submitting ? t("common.loading") : t("common.confirm")}</button>
            </div>
          </div>
        </div>
      )}
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// History
// ─────────────────────────────────────────────────────────────────────────────
const HISTORY_PAGE_SIZE = 10;

export function HistorySection() {
  const { t }   = useI18n();
  const [kind,        setKind]        = useState("all");
  const [status,      setStatus]      = useState("all");
  const [page,        setPage]        = useState(1);
  const [recharges,   setRecharges]   = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading,     setLoading]     = useState(true);

  function loadHistory({ silent = false } = {}) {
    if (!silent) setLoading(true);
    Promise.all([
      api.get("/recharge").then((d) => setRecharges(d.items  || [])),
      api.get("/withdraw").then((d) => setWithdrawals(d.items || [])),
    ]).catch(() => {}).finally(() => { if (!silent) setLoading(false); });
  }

  // Recharge/withdraw are approved by an admin elsewhere, so keep this view live:
  // poll every 20s + refetch on focus, and refresh the wallet balance too.
  useEffect(() => {
    loadHistory();
    const tick = () => { loadHistory({ silent: true }); refreshSession().catch(() => {}); };
    const id = setInterval(tick, 20000);
    window.addEventListener("focus", tick);
    return () => { clearInterval(id); window.removeEventListener("focus", tick); };
  }, []);

  const allItems = [
    ...recharges.map((r)   => ({ ...r, _kind: "recharge"   })),
    ...withdrawals.map((r) => ({ ...r, _kind: "withdrawal" })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const byKind     = kind   === "all" ? allItems : allItems.filter((r) => r._kind === kind);
  const filtered   = status === "all" ? byKind   : byKind.filter((r) => r.status === status);
  const totalPages = Math.ceil(filtered.length / HISTORY_PAGE_SIZE);
  const paged      = filtered.slice((page - 1) * HISTORY_PAGE_SIZE, page * HISTORY_PAGE_SIZE);

  const totalInByCurrency  = {};
  recharges.filter((r) => r.status === "completed").forEach((r) => { const code = r.currency || 'USD'; totalInByCurrency[code] = (totalInByCurrency[code] || 0) + r.amount; });
  const totalOutByCurrency = {};
  withdrawals.filter((r) => r.status === "completed").forEach((r) => { const code = r.currency || 'USD'; totalOutByCurrency[code] = (totalOutByCurrency[code] || 0) + r.amount; });

  return (
    <SectionWrap title={t("records.historyTitle")} icon="receipt" narrow>
      <div className="card-dark p-5 grid grid-cols-2 divide-x divide-gold-400/12">
        <div className="pr-5">
          <p className="text-[11px] text-ivory/40 uppercase tracking-widest mb-1">{t("records.totalIn")}</p>
          {Object.entries(totalInByCurrency).length === 0
            ? <p className="text-[18px] font-bold gold-text tracking-tight">0.00 USD</p>
            : Object.entries(totalInByCurrency).map(([code, sum]) => <p key={code} className="text-[18px] font-bold gold-text tracking-tight leading-snug">{fmtNative(sum, code)}</p>)
          }
        </div>
        <div className="pl-5">
          <p className="text-[11px] text-ivory/40 uppercase tracking-widest mb-1">{t("records.totalOut")}</p>
          {Object.entries(totalOutByCurrency).length === 0
            ? <p className="text-[18px] font-bold text-ivory tracking-tight">0.00 USD</p>
            : Object.entries(totalOutByCurrency).map(([code, sum]) => <p key={code} className="text-[18px] font-bold text-ivory tracking-tight leading-snug">{fmtNative(sum, code)}</p>)
          }
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Type — compact segmented control */}
        <div className="inline-flex p-1 rounded-xl gold-hairline bg-white/5 gap-1">
          {[{ key: "all", label: t("records.all"), icon: null }, { key: "recharge", label: t("records.rechargeTitle"), icon: "deposit" }, { key: "withdrawal", label: t("records.withdrawTitle"), icon: "withdraw" }].map((tab) => (
            <button key={tab.key} onClick={() => { setKind(tab.key); setPage(1); }}
              className={`h-8 px-3.5 rounded-lg text-[12px] font-semibold flex items-center justify-center gap-1.5 transition ${kind === tab.key ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-sm" : "text-ivory/55 hover:text-ivory"}`}>
              {tab.icon && <Icon name={tab.icon} size={13} />}{tab.label}
            </button>
          ))}
        </div>
        {/* Status — ghost pills */}
        <div className="flex gap-1.5">
          {["all", "completed", "reviewing"].map((s) => (
            <button key={s} onClick={() => { setStatus(s); setPage(1); }}
              className={`h-8 px-3.5 rounded-full text-[12px] font-semibold transition ${status === s ? "bg-gold-400/15 text-gold-300 gold-hairline" : "text-ivory/45 hover:text-ivory/80"}`}>
              {t(`records.${s}`)}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="text-center text-ivory/40 py-8">{t("common.loading")}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-ivory/40 py-10">{t("records.empty")}</div>
      ) : (
        <>
          <div className="space-y-2">
            {paged.map((r) => {
              const isIn = r._kind === "recharge";
              return (
                <div key={r.id} className="card-dark p-4 flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isIn ? "bg-gold-400/15 gold-hairline" : "bg-white/8 gold-hairline"}`}>
                    <Icon name={isIn ? "deposit" : "withdraw"} size={17} className={isIn ? "text-gold-300" : "text-ivory/60"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[13px] font-semibold text-ivory">{isIn ? r.method : r.walletType}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${r.status === "completed" ? "bg-emerald-500/15 text-emerald-400" : "bg-gold-400/15 text-gold-300"}`}>{t(`records.${r.status}`)}</span>
                    </div>
                    <p className="text-[11px] text-ivory/35 mt-0.5">{new Date(r.createdAt).toLocaleString()}</p>
                  </div>
                  <p className={`text-[14px] font-bold shrink-0 ${isIn ? "text-emerald-400" : "text-ivory/80"}`}>{isIn ? "+" : "−"}{fmtNative(r.amount, r.currency || 'USD')}</p>
                </div>
              );
            })}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section renderer by URL slug
// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// KYC Section
// ─────────────────────────────────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gold-400/10 last:border-0">
      <span className="text-[13px] text-ivory/50">{label}</span>
      <span className="text-[13px] font-medium text-ivory text-right max-w-[60%]">{value || "—"}</span>
    </div>
  );
}

export function KycSection({ session }) {
  const { t } = useI18n();
  const toast = useToast();
  const frontRef = useRef(null);
  const backRef  = useRef(null);

  const [name,          setName]          = useState("");
  const [idType,        setIdType]        = useState("");
  const [idNumber,      setIdNumber]      = useState("");
  const [phone,         setPhone]         = useState("");
  const [telegram,      setTelegram]      = useState("");
  const [whatsapp,      setWhatsapp]      = useState("");
  const [email,         setEmail]         = useState("");
  const [frontFile,     setFrontFile]     = useState(null);
  const [frontPreview,  setFrontPreview]  = useState(null);
  const [backFile,      setBackFile]      = useState(null);
  const [backPreview,   setBackPreview]   = useState(null);
  const [submitting,    setSubmitting]    = useState(false);

  const kycStatus = session?.kycStatus ?? "none";
  const kycData   = session?.kycData;

  function makeFileHandler(setFile, setPreview) {
    return (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target.result);
      reader.readAsDataURL(file);
    };
  }

  function clearFile(setFile, setPreview, ref) {
    setFile(null);
    setPreview(null);
    if (ref.current) ref.current.value = "";
  }

  const submit = async () => {
    if (!name.trim())     return toast.warning(t("kyc.enterName"));
    if (!idType)          return toast.warning(t("kyc.selectIdType"));
    if (!idNumber.trim()) return toast.warning(t("kyc.enterIdNumber"));
    if (!phone.trim())    return toast.warning(t("kyc.enterPhone"));
    if (!frontFile)       return toast.warning("Please upload the front photo of your ID / passport");
    if (!backFile)        return toast.warning("Please upload the back photo of your ID / passport");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name",     name.trim());
      fd.append("idType",   idType);
      fd.append("idNumber", idNumber.trim());
      fd.append("phone",    phone.trim());
      if (telegram) fd.append("telegram", telegram);
      if (whatsapp) fd.append("whatsapp", whatsapp);
      if (email)    fd.append("email",    email);
      fd.append("idFront", frontFile);
      fd.append("idBack",  backFile);
      await api.upload("/kyc", fd);
      await refreshSession();
      toast.success(t("kyc.successMsg"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  if (kycStatus === "pending") {
    return (
      <SectionWrap title={t("kyc.title")} icon="idCard" narrow>
        <div className="card-dark p-5 flex flex-col items-center text-center">
          <span className="pill pill-warning text-[12px] mb-3">{t("kyc.statusPending")}</span>
          <h3 className="serif text-[16px] font-semibold text-ivory">{t("kyc.pendingTitle")}</h3>
          <p className="text-[13px] text-ivory/55 mt-2">{t("kyc.pendingDesc")}</p>
        </div>
        {kycData && (
          <div className="card-dark p-4 space-y-0">
            <InfoRow label={t("kyc.fullName")} value={kycData.name} />
            <InfoRow label={t("kyc.idType")} value={kycData.idType === "card" ? t("kyc.idTypeCard") : t("kyc.idTypePassport")} />
            <InfoRow label={t("kyc.idNumber")} value={kycData.idNumber} />
            <InfoRow label={t("kyc.phone")} value={kycData.phone} />
            {(kycData.imageUrl || kycData.imageBackUrl) && (
              <div className="pt-3 space-y-2">
                <p className="text-[11px] text-ivory/40 uppercase tracking-widest">ID Document</p>
                <div className="grid grid-cols-2 gap-2">
                  {kycData.imageUrl && (
                    <div>
                      <p className="text-[10px] text-ivory/30 mb-1">Front</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fileUrl(kycData.imageUrl)} alt="ID front" className="w-full rounded-xl border border-gold-400/20 object-contain max-h-36" />
                    </div>
                  )}
                  {kycData.imageBackUrl && (
                    <div>
                      <p className="text-[10px] text-ivory/30 mb-1">Back</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={fileUrl(kycData.imageBackUrl)} alt="ID back" className="w-full rounded-xl border border-gold-400/20 object-contain max-h-36" />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </SectionWrap>
    );
  }

  if (kycStatus === "verified") {
    return (
      <SectionWrap title={t("kyc.title")} icon="idCard" narrow>
        <div className="card-dark max-w-sm px-6 py-9 flex flex-col items-center text-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-emerald-500/12 border border-emerald-400/25 flex items-center justify-center">
              <Icon name="shieldCheck" size={28} className="text-emerald-400" />
            </div>
            <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#110e09] flex items-center justify-center">
              <Icon name="check" size={10} className="text-white" />
            </span>
          </div>
          <div className="space-y-1">
            <p className="text-[18px] font-bold text-ivory serif">Identity Verified</p>
            <p className="text-[13px] text-ivory/50 leading-relaxed">{t("kyc.verifiedDesc")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-400/25 text-emerald-400 text-[12px] font-semibold">
            <Icon name="shieldCheck" size={12} /> {t("kyc.statusVerified")}
          </span>
        </div>
      </SectionWrap>
    );
  }

  // None / rejected — show form
  return (
    <SectionWrap title={t("kyc.title")} icon="idCard" narrow>
      <div className="card-dark px-4 py-3 flex items-center gap-3">
        <Icon name="idCard" size={18} className="text-gold-300 shrink-0" />
        <p className="text-[12px] text-ivory/60">{t("kyc.subtitle")}</p>
      </div>
      <div className="card-dark p-5 space-y-4">
        <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{t("kyc.sectionPersonal")}</p>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{t("kyc.fullName")}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t("kyc.fullName")} className="field-dark" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{t("kyc.idType")}</label>
          <select value={idType} onChange={(e) => setIdType(e.target.value)} className="field-dark">
            <option value="">{t("kyc.selectPlaceholder")}</option>
            <option value="card">{t("kyc.idTypeCard")}</option>
            <option value="passport">{t("kyc.idTypePassport")}</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{t("kyc.idNumber")}</label>
          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder={t("kyc.idNumber")} className="field-dark" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{t("kyc.phone")}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t("kyc.phone")} className="field-dark" />
        </div>

        {/* ID Document Upload — front and back */}
        <div className="space-y-2">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">ID / Passport Photos *</label>
          <input ref={frontRef} type="file" accept="image/*" onChange={makeFileHandler(setFrontFile, setFrontPreview)} className="hidden" />
          <input ref={backRef}  type="file" accept="image/*" onChange={makeFileHandler(setBackFile,  setBackPreview)}  className="hidden" />
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Front", preview: frontPreview, onPick: () => frontRef.current?.click(), onClear: () => clearFile(setFrontFile, setFrontPreview, frontRef) },
              { label: "Back",  preview: backPreview,  onPick: () => backRef.current?.click(),  onClear: () => clearFile(setBackFile,  setBackPreview,  backRef)  },
            ].map(({ label, preview, onPick, onClear }) => (
              <div key={label}>
                <p className="text-[10px] text-ivory/40 mb-1.5">{label}</p>
                {preview ? (
                  <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt={label} className="w-full max-h-36 rounded-xl border border-gold-400/20 object-contain" />
                    <button type="button" onClick={onClear} className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 text-ivory/70 flex items-center justify-center hover:text-ivory transition">
                      <Icon name="close" size={11} />
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={onPick} className="w-full h-28 rounded-xl border-2 border-dashed border-gold-400/25 hover:border-gold-400/50 flex flex-col items-center justify-center gap-2 text-ivory/40 hover:text-ivory/70 transition">
                    <Icon name="upload" size={20} />
                    <span className="text-[11px]">Upload {label}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="card-dark p-5 space-y-4">
        <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{t("kyc.sectionContact")}</p>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">Telegram</label>
          <input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder={t("kyc.telegramPlaceholder")} className="field-dark" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">WhatsApp</label>
          <input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder={t("kyc.whatsappPlaceholder")} className="field-dark" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("kyc.emailPlaceholder")} className="field-dark" />
        </div>
      </div>
      <button onClick={submit} disabled={submitting} className="btn-primary w-full h-[52px] text-[15px] disabled:opacity-60">
        {submitting ? t("common.loading") : t("kyc.submit")}
      </button>
    </SectionWrap>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// My Shop Section
// ─────────────────────────────────────────────────────────────────────────────
const SHOP_CATEGORIES = ["Electronics","Fashion","Beauty","Home","Sports","Toys","Books","Other"];

function ShopLogoUpload({ logoRef, logoPreview, onPick, onClear, required }) {
  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={onPick}
        className={`w-16 h-16 rounded-xl border flex items-center justify-center overflow-hidden transition shrink-0 ${
          required && !logoPreview
            ? "border-rose-400/50 bg-rose-500/8 border-solid"
            : "border-dashed border-gold-400/30 hover:border-gold-400/60 bg-white/3"
        }`}
      >
        {logoPreview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoPreview} alt="" className="w-full h-full object-cover" />
        ) : (
          <Icon name="upload" size={18} className={required ? "text-rose-400/60" : "text-ivory/30"} />
        )}
      </button>
      <div>
        <p className="text-[12px] font-semibold text-ivory/70">
          Shop Logo {required && <span className="text-rose-400">*</span>}
        </p>
        <p className="text-[11px] text-ivory/35 mt-0.5">JPG or PNG</p>
        {logoPreview ? (
          <button type="button" onClick={onClear} className="text-[11px] text-rose-400/70 hover:text-rose-400 mt-1 transition">Remove</button>
        ) : required ? (
          <p className="text-[11px] text-rose-400/70 mt-0.5">Required for resubmission</p>
        ) : null}
      </div>
    </div>
  );
}

export function MyShopSection({ session }) {
  const { t }    = useI18n();
  const toast    = useToast();
  const router   = useRouter();
  const logoRef  = useRef(null);

  const kycStatus  = session?.kycStatus ?? "none";
  const shopStatus = session?.shopStatus ?? null;
  const shopData   = session?.shopData ?? null;

  const [form, setForm] = useState({
    name: "", description: "", phone: "", telegram: "", whatsapp: "", email: "",
    contactName: "", addressLine1: "", addressLine2: "",
    city: "", state: "", country: "", postalCode: "",
  });
  const [logoFile,    setLogoFile]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [submitting,  setSubmitting]  = useState(false);

  // Pre-fill form when shop is suspended so merchant can edit existing data
  useEffect(() => {
    if (shopStatus === "suspended" && shopData) {
      setForm({
        name:        shopData.name    || "",
        description: shopData.desc    || "",
        phone:       shopData.phone   || "",
        telegram:    shopData.telegram || "",
        whatsapp:    shopData.whatsapp || "",
        email:       shopData.email   || "",
        contactName: "", addressLine1: "", addressLine2: "",
        city: "", state: "", country: "", postalCode: "",
      });
      if (shopData.logoUrl) setLogoPreview(fileUrl(shopData.logoUrl));
    }
  }, [shopStatus, shopData]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setLogoPreview(ev.target.result);
    reader.readAsDataURL(file);
  }

  function clearLogo() { setLogoFile(null); setLogoPreview(null); if (logoRef.current) logoRef.current.value = ""; }

  const handleSubmit = async () => {
    if (!form.name.trim()) return toast.warning(t("merchant.shop.nameRequired"));
    if (!logoPreview) return toast.warning(t("shopApp.logoRequired"));
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v?.trim()) fd.append(k, v.trim()); });
      if (logoFile) fd.append("logo", logoFile);
      await api.upload("/user/apply-shop", fd);
      await refreshSession();
      toast.success(t("shopApp.submitted"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResubmit = async () => {
    if (!form.name.trim()) return toast.warning(t("merchant.shop.nameRequired"));
    if (!logoFile && !shopData?.logoUrl) return toast.warning(t("shopApp.logoRequired"));
    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v?.trim()) fd.append(k, v.trim()); });
      if (logoFile) fd.append("logo", logoFile);
      await api.upload("/merchant/shop/resubmit", fd);
      await refreshSession();
      toast.success(t("shopApp.resubmittedToast"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // Not KYC verified
  if (kycStatus !== "verified") {
    return (
      <SectionWrap title={t("shopApp.title")} icon="store" narrow>
        <div className="card-dark px-6 py-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
            <Icon name="idCard" size={24} className="text-gold-300" />
          </div>
          <div className="space-y-1">
            <p className="text-[16px] font-semibold text-ivory serif">{t("shopApp.kycRequiredTitle")}</p>
            <p className="text-[13px] text-ivory/50 max-w-xs leading-relaxed">{t("shopApp.kycRequiredHint")}</p>
          </div>
          <button onClick={() => router.push("/profile/kyc")} className="btn-primary px-6 h-10 text-[13px]">
            {t("shopApp.goToKyc")}
          </button>
        </div>
      </SectionWrap>
    );
  }

  // Shop pending
  if (shopStatus === "pending") {
    return (
      <SectionWrap title={t("shopApp.title")} icon="store" narrow>
        <div className="card-dark px-6 py-10 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gold-400/10 border border-gold-400/20 flex items-center justify-center">
            {shopData?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fileUrl(shopData.logoUrl)} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <Icon name="store" size={24} className="text-gold-300" />
            )}
          </div>
          <div className="space-y-1">
            <p className="text-[16px] font-bold text-ivory serif">{shopData?.name}</p>
            <p className="text-[13px] text-ivory/50">{t("shopApp.underReview")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-400 text-[12px] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t("shopApp.pendingReview")}
          </span>
        </div>
      </SectionWrap>
    );
  }

  // Shop suspended — show editable form so merchant can fix and resubmit
  if (shopStatus === "suspended") {
    const logoRequired = !logoFile && !shopData?.logoUrl;
    return (
      <SectionWrap title={t("shopApp.title")} icon="store" narrow>
        <div className="max-w-[460px] space-y-4">
          {/* Suspension notice */}
          <div className="rounded-xl border border-rose-400/20 bg-rose-500/8 px-4 py-3 flex gap-3">
            <Icon name="alert" size={14} className="text-rose-400 shrink-0 mt-px" />
            <div>
              <p className="text-[13px] font-semibold text-rose-300 mb-0.5">{t("merchant.shop.suspendedTitle")}</p>
              {shopData?.rejectionNote && (
                <p className="text-[12px] text-rose-300/75 leading-relaxed mb-0.5">{shopData.rejectionNote}</p>
              )}
              <p className="text-[11px] text-rose-300/45">{t("shopApp.suspendedHint")}</p>
            </div>
          </div>

          {/* Form card */}
          <div className="card-dark divide-y divide-white/6">
            {/* Logo row */}
            <div className="px-4 py-4 flex items-center gap-4">
              <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              <button
                type="button"
                onClick={() => logoRef.current?.click()}
                className={`relative w-[120px] h-[90px] rounded-xl border overflow-hidden shrink-0 transition group ${
                  logoRequired ? "border-rose-400/40 bg-rose-500/6" : "border-gold-400/25 bg-white/3"
                }`}
              >
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoPreview} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                    <Icon name="upload" size={20} className={logoRequired ? "text-rose-400/50" : "text-ivory/25"} />
                    <span className="text-[10px] text-ivory/30">{t("shopApp.upload")}</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/55 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <Icon name="upload" size={18} className="text-white" />
                  <span className="text-[10px] font-semibold text-white">{t("shopApp.updateLogo")}</span>
                </div>
              </button>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-[12px] font-semibold text-ivory/70">{t("merchant.shop.logoLabel")} <span className="text-rose-400">*</span></p>
                <p className="text-[11px] text-ivory/35">{t("merchant.shop.logoHint")}</p>
                {logoPreview ? (
                  <button type="button" onClick={clearLogo} className="text-[11px] text-rose-400/60 hover:text-rose-400 transition block mt-1">{t("merchant.shop.remove")}</button>
                ) : logoRequired ? (
                  <p className="text-[11px] text-rose-400/60">{t("shopApp.required")}</p>
                ) : null}
              </div>
            </div>

            {/* Store name */}
            <div className="px-4 py-3 space-y-1">
              <label className="text-[10px] font-semibold text-gold-300/50 tracking-widest uppercase">{t("merchant.shop.nameLabel")}</label>
              <input value={form.name} onChange={set("name")} placeholder={t("merchant.shop.namePlaceholder")} className="field-dark w-full !h-9 !text-[13px]" />
            </div>

            {/* Description */}
            <div className="px-4 py-3 space-y-1">
              <label className="text-[10px] font-semibold text-gold-300/50 tracking-widest uppercase">{t("merchant.shop.descriptionLabel")}</label>
              <textarea value={form.description} onChange={set("description")} rows={2} placeholder={t("merchant.shop.descriptionPlaceholder")} className="field-dark w-full !text-[13px] !py-2 resize-none" />
            </div>

            {/* Contact grid */}
            <div className="px-4 py-3 grid grid-cols-2 gap-3">
              {[
                { k: "phone",    l: t("merchant.shop.phone")    },
                { k: "telegram", l: t("merchant.shop.telegram") },
                { k: "whatsapp", l: t("merchant.shop.whatsapp") },
                { k: "email",    l: t("merchant.shop.email")    },
              ].map(({ k, l }) => (
                <div key={k} className="space-y-1">
                  <label className="text-[10px] font-semibold text-gold-300/50 tracking-widest uppercase">{l}</label>
                  <input value={form[k]} onChange={set(k)} className="field-dark w-full !h-9 !text-[13px]" />
                </div>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleResubmit}
            disabled={submitting}
            className="btn-primary w-full h-10 text-[13px] disabled:opacity-60 flex items-center justify-center gap-2 font-semibold"
          >
            {submitting ? (
              <><div className="w-3.5 h-3.5 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> {t("shopApp.submitting")}</>
            ) : (
              <><Icon name="send" size={13} /> {t("merchant.shop.saveAndResubmit")}</>
            )}
          </button>
        </div>
      </SectionWrap>
    );
  }

  // Shop rejected
  if (shopStatus === "rejected") {
    return (
      <SectionWrap title={t("shopApp.title")} icon="store" narrow>
        <div className="card-dark px-6 py-8 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-full bg-rose-500/10 border border-rose-400/25 flex items-center justify-center">
            <Icon name="close" size={22} className="text-rose-400" />
          </div>
          <div className="space-y-1">
            <p className="text-[16px] font-bold text-ivory serif">{shopData?.name}</p>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-400/25 text-rose-400 text-[12px] font-semibold">{t("shopApp.rejectedBadge")}</span>
          </div>
          {shopData?.rejectionNote && (
            <div className="w-full max-w-sm bg-rose-500/8 border border-rose-400/20 rounded-xl px-4 py-3">
              <p className="text-[12px] text-rose-300/90 leading-relaxed">{shopData.rejectionNote}</p>
            </div>
          )}
          <p className="text-[12px] text-ivory/40">{t("shopApp.contactSupport")}</p>
        </div>
      </SectionWrap>
    );
  }

  // Shop active — merchant dashboard shortcut
  if (shopStatus === "active" && session?.isMerchant) {
    return (
      <SectionWrap title={t("shopApp.title")} icon="store" narrow>
        <div className="card-dark overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-stretch">
            {/* Logo — full-width banner on mobile, 4:3 side panel on desktop */}
            <div className="relative w-full aspect-[16/9] lg:w-[176px] lg:aspect-[4/3] shrink-0">
              {shopData?.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(shopData.logoUrl)} alt={shopData.name} className="w-full h-full object-cover block" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/4">
                  <Icon name="store" size={40} className="text-gold-300/35" />
                </div>
              )}
              {/* Mobile overlay: gradient + status badge + name over the banner */}
              <div className="lg:hidden absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
              <span className="lg:hidden absolute top-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 text-emerald-200 text-[11px] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {t("shopApp.active")}
              </span>
              <div className="lg:hidden absolute inset-x-0 bottom-0 p-4">
                <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gold-300/70 mb-0.5">{t("shopApp.yourStore")}</p>
                <p className="serif text-[22px] font-bold text-ivory leading-tight drop-shadow">{shopData?.name}</p>
              </div>
            </div>

            {/* Vertical divider — desktop only */}
            <div className="hidden lg:block w-px bg-white/8 shrink-0" />

            {/* Info + actions */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Shop identity — desktop header (mobile shows name over the banner) */}
              <div className="px-5 pt-4 pb-3 lg:flex-1 lg:px-6 lg:py-5">
                <div className="hidden lg:flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-gold-300/45 mb-1">{t("shopApp.yourStore")}</p>
                    <p className="serif text-[22px] font-bold text-ivory leading-tight">{shopData?.name}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-[11px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {t("shopApp.active")}
                  </span>
                </div>
                {shopData?.desc ? (
                  <p className="text-[13px] text-ivory/50 leading-relaxed line-clamp-2">{shopData.desc}</p>
                ) : (
                  <p className="text-[13px] text-ivory/30 italic">{t("shopApp.liveAccepting")}</p>
                )}
              </div>

              {/* Action bar */}
              <div className="border-t border-white/8 px-5 py-4 space-y-2.5 lg:px-6 lg:py-3 lg:flex lg:items-center lg:gap-2 lg:space-y-0 lg:flex-wrap">
                <Link href="/merchant" className="btn-primary w-full lg:w-auto h-11 lg:h-9 px-5 text-[13px] lg:text-[12px] inline-flex items-center justify-center gap-1.5 font-semibold shrink-0">
                  <Icon name="store" size={14} /> {t("shopApp.manageStore")}
                </Link>
                <div className="hidden lg:block flex-1" />
                <div className="grid grid-cols-3 gap-2 lg:flex lg:gap-2">
                  <Link href="/merchant/products" className="h-10 lg:h-9 px-2 lg:px-3.5 rounded-xl text-ivory/60 bg-white/4 border border-white/8 hover:bg-white/10 hover:text-ivory/90 transition flex items-center justify-center gap-1.5 text-[12px] shrink-0">
                    <Icon name="barChart" size={14} /> {t("merchant.nav.products")}
                  </Link>
                  <Link href="/merchant/shipping" className="h-10 lg:h-9 px-2 lg:px-3.5 rounded-xl text-ivory/60 bg-white/4 border border-white/8 hover:bg-white/10 hover:text-ivory/90 transition flex items-center justify-center gap-1.5 text-[12px] shrink-0">
                    <Icon name="truck" size={14} /> {t("shopApp.ordersLink")}
                  </Link>
                  <Link href="/merchant/shop" className="h-10 lg:h-9 px-2 lg:px-3.5 rounded-xl text-ivory/60 bg-white/4 border border-white/8 hover:bg-white/10 hover:text-ivory/90 transition flex items-center justify-center gap-1.5 text-[12px] shrink-0">
                    <Icon name="settings" size={14} /> {t("shopApp.settingsLink")}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SectionWrap>
    );
  }

  // No shop yet — application form
  return (
    <SectionWrap title={t("shopApp.title")} icon="store" narrow>
      <div className="card-dark px-4 py-3 flex items-center gap-3">
        <Icon name="store" size={16} className="text-gold-300 shrink-0" />
        <p className="text-[12px] text-ivory/55">{t("shopApp.fillDetails")}</p>
      </div>

      <div className="card-dark p-4 space-y-3">
        <p className="text-[10px] font-semibold text-gold-300/60 tracking-widest uppercase">{t("merchant.shop.storeInfo")}</p>

        {/* Logo upload */}
        <div className="flex items-center gap-4">
          <input ref={logoRef} type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          <button type="button" onClick={() => logoRef.current?.click()} className="w-16 h-16 rounded-xl border border-dashed border-gold-400/30 hover:border-gold-400/60 bg-white/3 flex items-center justify-center overflow-hidden transition shrink-0">
            {logoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <Icon name="upload" size={18} className="text-ivory/30" />
            )}
          </button>
          <div>
            <p className="text-[12px] font-semibold text-ivory/70">{t("merchant.shop.logoLabel")}</p>
            <p className="text-[11px] text-ivory/35 mt-0.5">{t("shopApp.logoOptionalHint")}</p>
            {logoPreview && (
              <button type="button" onClick={() => { setLogoFile(null); setLogoPreview(null); if (logoRef.current) logoRef.current.value = ""; }} className="text-[11px] text-rose-400/70 hover:text-rose-400 mt-1 transition">{t("merchant.shop.remove")}</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {[
            { key: "name", label: t("merchant.shop.nameLabel"), placeholder: t("merchant.shop.namePlaceholder"), full: true },
            { key: "description", label: t("merchant.shop.descriptionLabel"), placeholder: t("merchant.shop.descriptionPlaceholder"), full: true },
            { key: "phone", label: t("merchant.shop.phone"), type: "tel" },
            { key: "email", label: t("merchant.shop.email"), type: "email" },
            { key: "telegram", label: t("merchant.shop.telegram") },
            { key: "whatsapp", label: t("merchant.shop.whatsapp"), type: "tel" },
            { key: "contactName", label: t("merchant.shop.contactName"), full: true },
          ].map(({ key, label, placeholder, type = "text", full }) => (
            <div key={key} className={full ? "col-span-2" : ""}>
              <label className="text-[10px] font-semibold text-gold-300/55 tracking-widest uppercase block mb-1">{label}</label>
              <input type={type} value={form[key]} onChange={set(key)} placeholder={placeholder ?? label} className="field-dark w-full !h-9 !text-[13px]" />
            </div>
          ))}
        </div>
      </div>

      <div className="card-dark p-4 space-y-3">
        <p className="text-[10px] font-semibold text-gold-300/60 tracking-widest uppercase">{t("merchant.shop.address")} <span className="text-ivory/30 font-normal normal-case tracking-normal">{t("merchant.shop.optional")}</span></p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { key: "addressLine1", label: t("merchant.shop.address"), full: true },
            { key: "addressLine2", label: t("shopApp.aptSuite"), full: true },
            { key: "city",        label: t("merchant.shop.city") },
            { key: "postalCode",  label: t("merchant.shop.postalCode") },
            { key: "state",       label: t("merchant.shop.state") },
            { key: "country",     label: t("merchant.shop.country") },
          ].map(({ key, label, full }) => (
            <div key={key} className={full ? "col-span-2" : ""}>
              <label className="text-[10px] font-semibold text-gold-300/55 tracking-widest uppercase block mb-1">{label}</label>
              <input value={form[key]} onChange={set(key)} placeholder={label} className="field-dark w-full !h-9 !text-[13px]" />
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSubmit} disabled={submitting} className="btn-primary w-full h-11 text-[14px] disabled:opacity-60">
        {submitting ? t("common.loading") : t("shopApp.submitApplication")}
      </button>
    </SectionWrap>
  );
}

export function renderSectionBySlug(slug, { session, onCountChange } = {}) {
  switch (slug) {
    case "cart":          return <CartSection onCountChange={onCountChange} />;
    case "likes":         return <LikesSection />;
    case "shipping":      return <ShippingSection />;
    case "shipping-info": return <ShippingInfoSection />;
    case "kyc":           return <KycSection session={session} />;
    case "my-shop":       return <MyShopSection session={session} />;
    case "invite":        return <InviteSection />;
    case "language":      return <LanguageSection />;
    case "recharge":      return <RechargeSection />;
    case "withdraw":      return <WithdrawSection />;
    case "history":       return <HistorySection />;
    default:              return <OverviewSection session={session} />;
  }
}
