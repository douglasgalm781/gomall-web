"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api, ApiError, fileUrl } from "@/lib/api";
import Icon from "@/components/Icon";
import ImageCropUploader, { Cropper } from "@/components/ImageCropUploader";
import { useToast } from "@/components/Toast";
import { useI18n } from "@/lib/i18n";

const CURRENCIES = ["CNY","USD","VND","MYR","THB","SGD","USDT-TRC20","USDT-ERC20"];

const STATUS_PILL = {
  approved: "pill-success",
  pending:  "pill-warning",
  rejected: "pill-error",
};

const EMPTY = {
  brand: "", category: "", title: "", description: "", retailPrice: "", stock: "", currency: "CNY",
  saleType: "none", saleValue: "", saleStartsAt: "", saleEndsAt: "",
};

// MySQL "YYYY-MM-DD HH:mm:ss" <-> <input type="datetime-local"> "YYYY-MM-DDTHH:mm"
function toInputDateTime(v) {
  if (!v) return "";
  return String(v).replace(" ", "T").slice(0, 16);
}
function fromInputDateTime(v) {
  if (!v) return null;
  return v.replace("T", " ") + ":00";
}

function Modal({ title, onClose, children }) {
  // Portal to <body> so the backdrop covers the full viewport (escapes the
  // app's `relative z-10` stacking context / any ancestor containing block).
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="card-dark w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl chat-scrollbar">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold-400/10">
          <h3 className="serif text-[17px] font-bold text-ivory">{title}</h3>
          <button onClick={onClose} className="text-ivory/40 hover:text-ivory transition">
            <Icon name="close" size={20} />
          </button>
        </div>
        <div className="p-5 space-y-4">{children}</div>
      </div>
    </div>,
    document.body
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{label}</label>
      {children}
    </div>
  );
}

export default function MerchantProducts() {
  const { t }     = useI18n();
  const toast     = useToast();
  const subRef    = useRef(null);

  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [filter,     setFilter]     = useState("all");
  const [categories, setCategories] = useState([]);
  const [deletingId,      setDeletingId]      = useState(null);
  const [deleteConfirm,   setDeleteConfirm]   = useState(null); // product to confirm delete

  // Image state
  const [imageBlob,    setImageBlob]    = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  // Sub-image state: existing URLs + new File/Blob objects
  const [keepSubs,  setKeepSubs]  = useState([]); // existing /uploads/... URLs to keep
  const [newSubs,   setNewSubs]   = useState([]); // { blob, preview } objects for new uploads
  const [subCropFile, setSubCropFile] = useState(null); // sub-image awaiting crop

  function load({ silent = false } = {}) {
    if (!silent) setLoading(true);
    const qs = filter !== "all" ? `?approvalStatus=${filter}` : "";
    api.get(`/merchant/products${qs}`)
      .then((d) => setProducts(d.items || []))
      .catch(() => {})
      .finally(() => { if (!silent) setLoading(false); });
  }

  useEffect(() => { load(); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Approval status is changed by an admin elsewhere, so silently refetch when
  // the merchant returns to the tab to pick up approved/rejected changes.
  useEffect(() => {
    const onFocus = () => load({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get("/config/categories").then((d) => setCategories(d.items || [])).catch(() => {});
  }, []);

  function resetImageState() {
    setImageBlob(null);
    setImagePreview(null);
    setKeepSubs([]);
    setNewSubs([]);
  }

  function openCreate() {
    setForm(EMPTY);
    resetImageState();
    setModal({ mode: "create" });
  }

  function openEdit(p) {
    setForm({
      brand: p.brand, category: p.category, title: p.title,
      description: p.description || "", retailPrice: String(p.retailPrice),
      stock: String(p.stock), currency: p.currency || "CNY",
      saleType: p.saleType || "none",
      saleValue: p.saleValue != null ? String(p.saleValue) : "",
      saleStartsAt: toInputDateTime(p.saleStartsAt),
      saleEndsAt: toInputDateTime(p.saleEndsAt),
    });
    setImageBlob(null);
    setImagePreview(p.image ? fileUrl(p.image) : null);
    setKeepSubs(p.subImages || []);
    setNewSubs([]);
    setModal({ mode: "edit", product: p });
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Pick a single sub-image, then send it through the same crop/fit dialog.
  function handleSubFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setSubCropFile(file);
  }

  function addCroppedSub(blob, preview) {
    setSubCropFile(null);
    setNewSubs((prev) => [...prev, { blob, preview }]);
  }

  function removeKeepSub(url) {
    setKeepSubs((prev) => prev.filter((u) => u !== url));
  }

  function removeNewSub(idx) {
    setNewSubs((prev) => prev.filter((_, i) => i !== idx));
  }

  const totalSubs = keepSubs.length + newSubs.length;

  async function handleSave() {
    if (!form.brand.trim() || !form.title.trim() || !form.retailPrice) {
      return toast.warning(t("merchant.products.requiredFields"));
    }
    if (modal.mode === "create" && !imageBlob) {
      return toast.warning(t("merchant.products.imageRequired"));
    }
    if (form.saleType !== "none" && !form.saleValue) {
      return toast.warning(t("merchant.products.saleValueRequired"));
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        saleStartsAt: fromInputDateTime(form.saleStartsAt),
        saleEndsAt: fromInputDateTime(form.saleEndsAt),
      };
      const fd = new FormData();
      Object.entries(payload).forEach(([k, v]) => {
        if (v != null && v !== "") fd.append(k, v);
      });
      if (imageBlob) fd.append("image", imageBlob, "image.jpg");
      fd.append("keepSubImages", JSON.stringify(keepSubs));
      newSubs.forEach(({ blob }) => fd.append("subImages", blob, "sub.jpg"));

      if (modal.mode === "create") {
        await api.upload("/merchant/products", fd);
        toast.success(t("merchant.products.submitted"));
      } else {
        await api.uploadPut(`/merchant/products/${modal.product.id}`, fd);
        toast.success(modal.product.approvalStatus === "rejected"
          ? t("merchant.products.resubmitted")
          : t("merchant.products.updated"));
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("merchant.products.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p) {
    setDeleteConfirm(p);
  }

  async function confirmDelete() {
    const p = deleteConfirm;
    if (!p) return;
    setDeleteConfirm(null);
    setDeletingId(p.id);
    try {
      await api.del(`/merchant/products/${p.id}`);
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      toast.success(t("merchant.products.deleted"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("merchant.products.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  }

  async function toggleVisibility(p) {
    try {
      await api.patch(`/merchant/products/${p.id}/visibility`, { isActive: !p.isActive });
      setProducts((prev) => prev.map((x) => x.id === p.id ? { ...x, isActive: !p.isActive } : x));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("merchant.products.visibilityFailed"));
    }
  }

  const filters = [
    { key: "all",      label: t("merchant.products.filterAll")      },
    { key: "approved", label: t("merchant.products.filterApproved") },
    { key: "pending",  label: t("merchant.products.filterPending")  },
    { key: "rejected", label: t("merchant.products.filterRejected") },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="serif text-2xl font-bold text-ivory">{t("merchant.products.title")}</h1>
          <button onClick={() => load()} disabled={loading} title={t("common.refresh")}
            className="w-9 h-9 rounded-full gold-hairline bg-white/5 text-gold-300 flex items-center justify-center hover:bg-white/10 transition disabled:opacity-50">
            <Icon name="refresh" size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2 px-4 h-10 text-[13px]">
          <Icon name="plus" size={15} /> {t("merchant.products.addProduct")}
        </button>
      </div>

      <div className="flex gap-1 bg-white/5 rounded-xl p-1 w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition ${
              filter === f.key ? "bg-gold-400/20 text-gold-300" : "text-ivory/50 hover:text-ivory"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-ivory/40 py-10">{t("common.loading")}</p>
      ) : products.length === 0 ? (
        <div className="card-dark p-10 text-center text-ivory/40 space-y-3">
          <Icon name="package" size={32} className="mx-auto opacity-30" />
          <p className="text-[14px]">{t("merchant.products.empty")}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map((p) => (
            <div key={p.id} className="card-dark p-4 flex items-center gap-4">
              {p.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fileUrl(p.image)} alt="" className="w-14 h-[70px] rounded-xl object-cover border border-gold-400/15 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`pill text-[10px] ${STATUS_PILL[p.approvalStatus] || "pill-warning"}`}>
                    {t(`merchant.products.filter${p.approvalStatus.charAt(0).toUpperCase()}${p.approvalStatus.slice(1)}`)}
                  </span>
                  {p.approvalStatus === "approved" && (
                    <span className={`pill text-[10px] ${p.isActive ? "pill-success" : "bg-white/8 text-ivory/40"}`}>
                      {p.isActive ? t("merchant.products.visible") : t("merchant.products.hidden")}
                    </span>
                  )}
                  {p.onSale && (
                    <span className="pill text-[10px] bg-rose-500/15 text-rose-300">
                      {p.saleType === "percent" ? `${p.saleValue}% off` : t("merchant.products.onSale")}
                    </span>
                  )}
                </div>
                <p className="text-[14px] font-semibold text-ivory mt-1 truncate">{p.title}</p>
                <p className="text-[12px] text-ivory/50">{p.brand} · {p.category} · ${p.retailPrice} · {t("common.inStock").replace("{n}", p.stock)}</p>
                {p.approvalNote && (
                  <p className="text-[11px] text-rose-300/80 mt-1">{p.approvalNote}</p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {p.approvalStatus === "approved" && (
                  <button
                    onClick={() => toggleVisibility(p)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition ${
                      p.isActive ? "bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25" : "bg-white/8 text-ivory/50 hover:bg-white/12"
                    }`}
                    title={p.isActive ? t("common.hide") : t("common.show")}
                  >
                    <Icon name={p.isActive ? "eye" : "eyeOff"} size={16} />
                  </button>
                )}
                <button
                  onClick={() => openEdit(p)}
                  className="w-9 h-9 rounded-full bg-gold-400/12 text-gold-300 hover:bg-gold-400/20 flex items-center justify-center transition"
                  title={t("common.edit")}
                >
                  <Icon name="edit" size={15} />
                </button>
                <button
                  onClick={() => handleDelete(p)}
                  disabled={deletingId === p.id}
                  className="w-9 h-9 rounded-full bg-rose-500/12 text-rose-400 hover:bg-rose-500/22 flex items-center justify-center transition disabled:opacity-40"
                  title={t("common.delete")}
                >
                  <Icon name="trash" size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && createPortal((
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative card-dark w-full max-w-sm rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-rose-500/15 text-rose-400">
                <Icon name="trash" size={18} />
              </span>
              <div className="pt-0.5">
                <h3 className="serif text-[17px] font-bold text-ivory">{t("merchant.products.deleteConfirmTitle")}</h3>
                <p className="text-[13px] text-ivory/60 mt-1 leading-relaxed">
                  {t("merchant.products.deleteConfirmBody").replace("{title}", deleteConfirm.title)}
                </p>
              </div>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 h-10 rounded-xl border border-white/12 text-ivory/70 hover:text-ivory hover:bg-white/8 text-[13px] font-medium transition"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 h-10 rounded-xl bg-rose-500 hover:bg-rose-400 text-white text-[13px] font-semibold transition"
              >
                {t("common.delete")}
              </button>
            </div>
          </div>
        </div>
      ), document.body)}

      {modal && (
        <Modal
          title={modal.mode === "create" ? t("merchant.products.addModalTitle") : t("merchant.products.editModalTitle")}
          onClose={() => setModal(null)}
        >
          {modal.mode === "edit" && modal.product.approvalStatus === "rejected" && (
            <div className="bg-rose-500/10 border border-rose-400/30 rounded-xl px-4 py-3 text-[12px] text-rose-300">
              {t("merchant.products.rejectedNotice")}
              {modal.product.approvalNote && <span className="block mt-1 opacity-70">{modal.product.approvalNote}</span>}
            </div>
          )}

          {/* Main image + sub-images */}
          <div>
            <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase block mb-2">
              {t("merchant.products.imageLabel")}
            </label>
            <div className="flex gap-3 flex-wrap">
              {/* Main crop uploader */}
              <div className="w-[90px]">
                <ImageCropUploader
                  value={imagePreview}
                  label={t("merchant.products.mainLabel")}
                  onCrop={(blob, preview) => { setImageBlob(blob); setImagePreview(preview); }}
                />
              </div>

              {/* Sub-images */}
              {keepSubs.map((url) => (
                <div key={url} className="relative w-[90px] aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fileUrl(url)} alt="" className="w-full h-full object-cover rounded-xl border border-gold-400/20" />
                  <button
                    type="button"
                    onClick={() => removeKeepSub(url)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-400 transition"
                  >
                    <Icon name="close" size={10} />
                  </button>
                </div>
              ))}
              {newSubs.map(({ preview }, idx) => (
                <div key={idx} className="relative w-[90px] aspect-[4/5]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={preview} alt="" className="w-full h-full object-cover rounded-xl border border-gold-400/20" />
                  <button
                    type="button"
                    onClick={() => removeNewSub(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-400 transition"
                  >
                    <Icon name="close" size={10} />
                  </button>
                </div>
              ))}
              {/* Add sub-image slot */}
              {totalSubs < 6 && (
                <div className="w-[90px] aspect-[4/5]">
                  <input ref={subRef} type="file" accept="image/*" onChange={handleSubFile} className="hidden" />
                  <button
                    type="button"
                    onClick={() => subRef.current?.click()}
                    className="w-full h-full rounded-xl border-2 border-dashed border-gold-400/25 hover:border-gold-400/50 bg-white/3 flex flex-col items-center justify-center gap-1 text-ivory/30 hover:text-ivory/60 transition"
                  >
                    <Icon name="plus" size={18} />
                    <span className="text-[10px]">{t("merchant.products.subLabel")}</span>
                  </button>
                </div>
              )}
            </div>
            <p className="text-[10px] text-ivory/30 mt-1.5">{t("merchant.products.imageHint")}</p>
          </div>

          <Field label={t("merchant.products.brand")}>
            <input value={form.brand} onChange={set("brand")} placeholder={t("merchant.products.brandPlaceholder")} className="field-dark" />
          </Field>
          <Field label={t("merchant.products.category")}>
            <select value={form.category} onChange={set("category")} className="field-dark">
              <option value="">{t("merchant.products.selectCategory")}</option>
              {categories.map((c) => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </Field>
          <Field label={t("merchant.products.titleLabel")}>
            <input value={form.title} onChange={set("title")} placeholder={t("merchant.products.titlePlaceholder")} className="field-dark" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={t("merchant.products.price")}>
              <input
                type="number" value={form.retailPrice} onChange={set("retailPrice")}
                placeholder="0.00" min="0" step="0.01"
                className="field-dark [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </Field>
            <Field label={t("merchant.products.currency")}>
              <select value={form.currency} onChange={set("currency")} className="field-dark">
                {CURRENCIES.map((c) => <option key={c} value={c}>{c.replace("USDT-", "USDT/")}</option>)}
              </select>
            </Field>
            <Field label={t("merchant.products.stock")}>
              <input
                type="number" value={form.stock} onChange={set("stock")}
                placeholder="0" min="0"
                className="field-dark [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
              />
            </Field>
          </div>
          <Field label={t("merchant.products.description")}>
            <textarea value={form.description} onChange={set("description")} placeholder={t("merchant.products.descriptionPlaceholder")} rows={5} className="field-dark resize-none !h-auto min-h-[120px] !py-3 leading-relaxed" />
          </Field>

          <div className="pt-2 border-t border-gold-400/10 space-y-3">
            <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">{t("merchant.products.sale")}</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("merchant.products.saleType")}>
                <select value={form.saleType} onChange={set("saleType")} className="field-dark">
                  <option value="none">{t("merchant.products.noSale")}</option>
                  <option value="percent">{t("merchant.products.percentOff")}</option>
                  <option value="fixed">{t("merchant.products.fixedPrice")}</option>
                </select>
              </Field>
              {form.saleType !== "none" && (
                <Field label={form.saleType === "percent" ? t("merchant.products.percentOffLabel") : t("merchant.products.salePriceLabel")}>
                  <input
                    type="number" value={form.saleValue} onChange={set("saleValue")}
                    placeholder={form.saleType === "percent" ? t("merchant.products.percentPlaceholder") : "0.00"}
                    min="0" step="0.01" max={form.saleType === "percent" ? 99 : undefined}
                    className="field-dark [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                </Field>
              )}
            </div>
            {form.saleType !== "none" && (
              <div className="grid grid-cols-2 gap-3">
                <Field label={t("merchant.products.startsOptional")}>
                  <input type="datetime-local" value={form.saleStartsAt} onChange={set("saleStartsAt")} className="field-dark" />
                </Field>
                <Field label={t("merchant.products.endsOptional")}>
                  <input type="datetime-local" value={form.saleEndsAt} onChange={set("saleEndsAt")} className="field-dark" />
                </Field>
              </div>
            )}
            {form.saleType !== "none" && (
              <p className="text-[11px] text-ivory/35">{t("merchant.products.saleHint")}</p>
            )}
          </div>

          <button onClick={handleSave} disabled={saving} className="btn-primary w-full h-12 text-[14px] disabled:opacity-60">
            {saving ? t("common.saving") : modal.mode === "create" ? t("merchant.products.submitForApproval") : t("merchant.shop.saveChanges")}
          </button>

          {/* Sub-image crop/fit dialog */}
          {subCropFile && (
            <Cropper
              file={subCropFile}
              aspect={4 / 5}
              maxWidth={1000}
              onCropped={addCroppedSub}
              onCancel={() => setSubCropFile(null)}
            />
          )}
        </Modal>
      )}
    </div>
  );
}
