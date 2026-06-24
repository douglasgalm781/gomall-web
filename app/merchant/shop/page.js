"use client";
import { useEffect, useState } from "react";
import { api, ApiError, fileUrl } from "@/lib/api";
import Icon from "@/components/Icon";
import ImageCropUploader from "@/components/ImageCropUploader";
import { useToast } from "@/components/Toast";
import { refreshSession } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

function Field({ label, half, children }) {
  return (
    <div className={half ? "" : "col-span-2"}>
      <label className="text-[10px] font-semibold text-gold-300/55 tracking-widest uppercase block mb-1">{label}</label>
      {children}
    </div>
  );
}

export default function MerchantShop() {
  const { t } = useI18n();
  const toast = useToast();

  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState(null);
  const [shopStatus,  setShopStatus]  = useState(null);
  const [suspendNote, setSuspendNote] = useState(null);
  const [logoBlob,    setLogoBlob]    = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [form, setForm] = useState({
    name: "", description: "", phone: "", telegram: "", whatsapp: "", email: "",
    contactName: "", addressLine1: "", addressLine2: "",
    city: "", state: "", country: "", postalCode: "",
  });

  useEffect(() => {
    api.get("/merchant/shop")
      .then((s) => {
        setForm({
          name:         s.name         || "",
          description:  s.description  || "",
          phone:        s.phone        || "",
          telegram:     s.telegram     || "",
          whatsapp:     s.whatsapp     || "",
          email:        s.email        || "",
          contactName:  s.contactName  || "",
          addressLine1: s.addressLine1 || "",
          addressLine2: s.addressLine2 || "",
          city:         s.city         || "",
          state:        s.state        || "",
          country:      s.country      || "",
          postalCode:   s.postalCode   || "",
        });
        setShopStatus(s.status);
        setSuspendNote(s.rejectionNote || null);
        if (s.logoUrl) setLogoPreview(fileUrl(s.logoUrl));
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : t("merchant.shop.loadFailed")))
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const isSuspended = shopStatus === "suspended";

  async function handleSave() {
    if (!form.name.trim()) return toast.warning(t("merchant.shop.nameRequired"));
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logoBlob) fd.append("logo", logoBlob, "logo.jpg");
      if (isSuspended) {
        await api.upload("/merchant/shop/resubmit", fd);
        setShopStatus("pending");
        setSuspendNote(null);
        await refreshSession();
        toast.success(t("merchant.shop.resubmitted"));
      } else {
        await api.uploadPut("/merchant/shop", fd);
        toast.success(t("merchant.shop.saved"));
      }
      setLogoBlob(null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("merchant.shop.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-center text-ivory/40 py-10">{t("common.loading")}</p>;
  if (error)   return <p className="text-center text-rose-400 py-10">{error}</p>;

  return (
    <div className="space-y-5 max-w-xl">
      <h1 className="serif text-2xl font-bold text-ivory">{t("merchant.shop.title")}</h1>

      {isSuspended && (
        <div className="rounded-xl border border-rose-400/25 bg-rose-500/8 px-4 py-4 space-y-1.5">
          <div className="flex items-center gap-2">
            <Icon name="alert" size={15} className="text-rose-400 shrink-0" />
            <p className="text-[13px] font-semibold text-rose-300">{t("merchant.shop.suspendedTitle")}</p>
          </div>
          {suspendNote && (
            <p className="text-[12px] text-rose-300/80 leading-relaxed pl-5">{suspendNote}</p>
          )}
          <p className="text-[12px] text-rose-300/55 pl-5">{t("merchant.shop.suspendedHint")}</p>
        </div>
      )}

      {shopStatus === "pending" && (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/8 px-4 py-3 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
          <p className="text-[13px] text-amber-300">{t("merchant.shop.pendingHint")}</p>
        </div>
      )}

      <div className="card-dark p-4 space-y-4">
        <p className="text-[10px] font-semibold text-gold-300/60 tracking-widest uppercase">{t("merchant.shop.storeInfo")}</p>

        {/* Logo upload with 4:3 crop */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-semibold text-gold-300/55 tracking-widest uppercase block">{t("merchant.shop.logoLabel")}</label>
          <div className="flex items-end gap-4">
            <div className="w-32">
              <ImageCropUploader
                value={logoPreview}
                label={t("merchant.shop.uploadLogo")}
                aspect={4 / 3}
                maxWidth={800}
                onCrop={(blob, preview) => { setLogoBlob(blob); setLogoPreview(preview); }}
              />
            </div>
            <div className="space-y-1 pb-1">
              <p className="text-[11px] text-ivory/35">{t("merchant.shop.logoHint")}</p>
              {logoPreview && (
                <button
                  type="button"
                  onClick={() => { setLogoBlob(null); setLogoPreview(null); }}
                  className="text-[11px] text-rose-400/70 hover:text-rose-400 transition"
                >
                  {t("merchant.shop.remove")}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Field label={t("merchant.shop.nameLabel")}>
            <input value={form.name} onChange={set("name")} placeholder={t("merchant.shop.namePlaceholder")} className="field-dark w-full !h-9 !text-[13px]" />
          </Field>
          <Field label={t("merchant.shop.descriptionLabel")}>
            <textarea value={form.description} onChange={set("description")} rows={2} placeholder={t("merchant.shop.descriptionPlaceholder")} className="field-dark w-full !text-[13px] !py-2 resize-none" />
          </Field>
          <Field label={t("merchant.shop.contactName")}>
            <input value={form.contactName} onChange={set("contactName")} className="field-dark w-full !h-9 !text-[13px]" />
          </Field>
          <Field label={t("merchant.shop.phone")} half>
            <input type="tel" value={form.phone} onChange={set("phone")} className="field-dark w-full !h-9 !text-[13px]" />
          </Field>
          <Field label={t("merchant.shop.email")} half>
            <input type="email" value={form.email} onChange={set("email")} className="field-dark w-full !h-9 !text-[13px]" />
          </Field>
          <Field label={t("merchant.shop.telegram")} half>
            <input value={form.telegram} onChange={set("telegram")} className="field-dark w-full !h-9 !text-[13px]" />
          </Field>
          <Field label={t("merchant.shop.whatsapp")} half>
            <input type="tel" value={form.whatsapp} onChange={set("whatsapp")} className="field-dark w-full !h-9 !text-[13px]" />
          </Field>
        </div>
      </div>

      <div className="card-dark p-4 space-y-3">
        <p className="text-[10px] font-semibold text-gold-300/60 tracking-widest uppercase">
          {t("merchant.shop.address")} <span className="text-ivory/30 font-normal normal-case tracking-normal">{t("merchant.shop.optional")}</span>
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { k: "addressLine1", l: t("merchant.shop.addressLine1"), half: false },
            { k: "addressLine2", l: t("merchant.shop.addressLine2"), half: false },
            { k: "city",         l: t("merchant.shop.city"),         half: true  },
            { k: "postalCode",   l: t("merchant.shop.postalCode"),   half: true  },
            { k: "state",        l: t("merchant.shop.state"),        half: true  },
            { k: "country",      l: t("merchant.shop.country"),      half: true  },
          ].map(({ k, l, half }) => (
            <Field key={k} label={l} half={half}>
              <input value={form[k]} onChange={set(k)} placeholder={l} className="field-dark w-full !h-9 !text-[13px]" />
            </Field>
          ))}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving || shopStatus === "pending"}
        className={`w-full h-11 text-[14px] disabled:opacity-60 flex items-center justify-center gap-2 rounded-xl font-semibold transition ${
          isSuspended
            ? "bg-rose-500 hover:bg-rose-400 text-white"
            : "btn-primary"
        }`}
      >
        {saving ? (
          <><div className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" /> {t("common.saving")}</>
        ) : isSuspended ? (
          <><Icon name="send" size={15} /> {t("merchant.shop.saveAndResubmit")}</>
        ) : (
          <><Icon name="check" size={16} /> {t("merchant.shop.saveChanges")}</>
        )}
      </button>
    </div>
  );
}
