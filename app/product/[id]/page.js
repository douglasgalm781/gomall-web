"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError, normalizeProduct, fileUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { useSession } from "@/lib/store";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";
import SaleBadge from "@/components/SaleBadge";
import { useBuyNow } from "@/components/BuyNowProvider";

function Stars({ rating }) {
  const filled = Math.round(rating);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" size={12}
          fill={n <= filled ? "currentColor" : "none"}
          strokeWidth={n <= filled ? 0 : 1.5}
          className={n <= filled ? "text-gold-400" : "text-ivory/20"}
        />
      ))}
    </div>
  );
}

function SimilarCard({ p, currency, t, onBuyNow, onAddToCart, addingToCart, hasSession }) {
  return (
    <Link href={`/product/${p.id}${p.shopId ? `?shopId=${p.shopId}` : ""}`} className="group block">
      <div className="overflow-hidden rounded-xl gold-hairline relative">
        <LuxImage
          src={p.image}
          alt={p.brand}
          className="aspect-[3/4] group-hover:scale-105 transition-transform duration-500"
          label={p.brand}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        <SaleBadge onSale={p.onSale} price={p.retail} originalPrice={p.originalPrice} size="sm" />
        {hasSession && (p.stock ?? 0) > 0 && (
          <div className="absolute bottom-2 left-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBuyNow(p); }}
              className="h-8 rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
            >
              <Icon name="zap" size={12} /> {t("buy.buyNow")}
            </button>
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onAddToCart(p.inventoryId); }}
              disabled={addingToCart}
              className="h-8 rounded-xl glass-dark gold-hairline text-gold-200 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 hover:text-gold-100 transition"
            >
              {addingToCart
                ? <><div className="w-3 h-3 border-2 border-gold-200/30 border-t-gold-200 rounded-full animate-spin" /></>
                : <><Icon name="bag" size={12} /> {t("product.addToCart")}</>
              }
            </button>
          </div>
        )}
      </div>
      <div className="pt-2.5 px-0.5">
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold-300/60 truncate">{p.brand}</p>
        <p className="text-ivory/80 text-[12px] leading-snug line-clamp-2 mt-0.5">{p.title}</p>
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          <span className="text-gold-200 text-[13px] font-semibold tracking-tight">{fmtNative(p.retail, currency.code)}</span>
          {p.onSale && p.originalPrice > p.retail && (
            <span className="text-ivory/30 text-[11px] line-through">{fmtNative(p.originalPrice, currency.code)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ProductPage() {
  const { id }   = useParams();
  const router   = useRouter();
  const { t, lang } = useI18n();
  const { currency } = useCurrency();
  const session = useSession();
  const toast    = useToast();
  const openBuyNow = useBuyNow();

  const [qty,        setQty]        = useState(1);
  const [product,    setProduct]    = useState(null);
  const [notFound,   setNotFound]   = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [similar,    setSimilar]    = useState([]);
  const [similarAddingIds, setSimilarAddingIds] = useState(new Set());
  const [liked,      setLiked]      = useState(false);
  const [liking,     setLiking]     = useState(false);
  const [activeImg,  setActiveImg]  = useState(null); // null = main image
  const [zooming,    setZooming]    = useState(false);
  const [zoomPos,    setZoomPos]    = useState({ x: 50, y: 50 });
  const [lightbox,   setLightbox]   = useState(false);
  const [lbIdx,      setLbIdx]      = useState(0);
  const imgContainerRef = useRef(null);
  const lbTotalRef      = useRef(1);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    setProduct(null); setNotFound(false); setSimilar([]); setLiked(false); setActiveImg(null);
    // Read shopId from URL at effect-run time to avoid stale-closure issues.
    // The backend defaults to the cheapest shop if shopId is absent.
    const shopId = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("shopId")
      : null;
    const shopQuery = shopId ? `&shopId=${shopId}` : "";
    const langParam = lang === "zh" ? "&lang=zh" : "";
    api.get(`/listings/${id}?currency=${currency.code}${shopQuery}${langParam}`)
      .then((p) => setProduct(normalizeProduct(p)))
      .catch(() => setNotFound(true));
  }, [id, currency.code, lang]);

  useEffect(() => {
    api.get(`/likes/${id}`).then((d) => setLiked(d.liked)).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!product?.category) return;
    // Fetch more than needed to account for deduplication (same product from multiple shops)
    api.get(`/listings?category=${product.category}&currency=${currency.code}&pageSize=20${lang === "zh" ? "&lang=zh" : ""}`)
      .then((data) => {
        const seen = new Set();
        const unique = (data.items || [])
          .map(normalizeProduct)
          .filter((p) => {
            if (String(p.id) === String(id)) return false; // exclude current product
            if (seen.has(p.id)) return false;              // deduplicate same product from multiple shops
            seen.add(p.id);
            return true;
          })
          .slice(0, 6);
        setSimilar(unique);
      }).catch(() => {});
  }, [product?.category, id, currency.code, lang]);

  useEffect(() => {
    if (!lightbox) return;
    document.body.style.overflow = "hidden";
    function onKey(e) {
      const n = lbTotalRef.current;
      if (e.key === "ArrowLeft")  setLbIdx((i) => (i - 1 + n) % n);
      if (e.key === "ArrowRight") setLbIdx((i) => (i + 1) % n);
      if (e.key === "Escape")     setLightbox(false);
    }
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [lightbox]);

  if (notFound) {
    return (
      <div className="luxe min-h-screen flex flex-col items-center justify-center gap-4 text-ivory/50">
        <Icon name="alert" size={40} className="text-gold-300/40" />
        <p>{t("product.notFound")}</p>
        <button onClick={() => router.back()} className="btn-ghost px-6 h-11 text-[14px]">{t("common.back")}</button>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="luxe min-h-screen flex items-center justify-center text-ivory/50">{t("common.loading")}</div>
    );
  }

  const allImages = [product.image, ...(product.subImages || [])];
  lbTotalRef.current = allImages.length;

  const currentSrc = fileUrl(activeImg || product.image) || (activeImg || product.image);

  function handleZoomMove(e) {
    if (!imgContainerRef.current) return;
    const rect = imgContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomPos({ x, y });
  }

  const total = product.retail * qty;
  const toggleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { liked: newLiked } = await api.post(`/likes/${product.id}`);
      setLiked(newLiked);
      toast.success(newLiked ? t("likes.added") : t("likes.removed"));
    } catch { toast.error(t("common.loadFailed")); }
    finally { setLiking(false); }
  };
  const buyNow = () => { openBuyNow(product, qty); setQty(1); };

  const confirmPurchase = async () => {
    setPurchasing(true);
    try {
      const res = await api.post("/cart", { inventoryId: product.inventoryId, qty });
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: res.count ?? null } }));
      toast.success(t("cart.addedMsg"));
      setQty(1);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally { setPurchasing(false); }
  };

  const addSimilarToCart = async (inventoryId) => {
    if (!session) { router.push("/login"); return; }
    if (similarAddingIds.has(inventoryId)) return;
    setSimilarAddingIds((prev) => new Set(prev).add(inventoryId));
    try {
      const res = await api.post("/cart", { inventoryId, qty: 1 });
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: res.count ?? null } }));
      toast.success(t("cart.addedMsg"));
    } catch {
      toast.error(t("common.loadFailed"));
    } finally {
      setSimilarAddingIds((prev) => { const s = new Set(prev); s.delete(inventoryId); return s; });
    }
  };

  return (
    <div className="luxe min-h-screen">

      {/* ── Back header ─────────────────────────────────────────────── */}
      <div className="sticky top-0 lg:top-16 z-30 glass-dark border-b border-gold-400/15 h-14 flex items-center px-4 md:px-8 lg:px-12 gap-3">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="-ml-1.5 w-9 h-9 flex items-center justify-center text-ivory/80 hover:text-gold-300 transition active:scale-90"
        >
          <Icon name="chevronLeft" size={24} />
        </button>
        {product && (
          <p className="text-[14px] font-semibold text-ivory/80 truncate leading-tight">
            {product.brand} <span className="text-ivory/45 font-normal">· {product.title}</span>
          </p>
        )}
      </div>

      {/* ── Two-column layout ────────────────────────────────────────── */}
      <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-12 py-6 lg:py-10">
        <div className="lg:grid lg:grid-cols-[42%_1fr] lg:gap-14 lg:items-start">

          {/* LEFT — image gallery */}
          <div className="relative lg:sticky lg:top-[8.5rem] lg:z-10">

            <SaleBadge onSale={product.onSale} price={product.retail} originalPrice={product.originalPrice} size="lg" />

            {/* Like button — overlaid on image */}
            <button
              onClick={toggleLike}
              disabled={liking}
              className={`absolute top-3 right-3 z-10 w-10 h-10 rounded-full glass-dark gold-hairline flex items-center justify-center transition-all active:scale-90 shadow-lg ${
                liked ? "text-red-400" : "text-ivory/70 hover:text-red-400"
              }`}
            >
              <Icon name="heart" size={17} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 1.5} />
            </button>

            {/* Main displayed image */}
            <div
              ref={imgContainerRef}
              className="overflow-hidden rounded-2xl gold-hairline cursor-zoom-in"
              onMouseEnter={() => setZooming(true)}
              onMouseLeave={() => setZooming(false)}
              onMouseMove={handleZoomMove}
              onClick={() => {
                const idx = activeImg ? allImages.indexOf(activeImg) : 0;
                setLbIdx(Math.max(0, idx));
                setLightbox(true);
                setZooming(false);
              }}
            >
              <LuxImage
                src={currentSrc}
                alt={product.title}
                className="w-full aspect-[3/4] object-cover transition-opacity duration-200"
                label={product.brand}
              />
            </div>

            {/* Zoom panel — desktop hover only, fixed centered overlay */}
            {zooming && !lightbox && (
              <div
                className="hidden lg:block fixed rounded-2xl gold-hairline shadow-2xl pointer-events-none z-50"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  height: "min(80vh, 720px)",
                  aspectRatio: "3 / 4",
                  maxWidth: "88vw",
                  backgroundImage: `url(${currentSrc})`,
                  backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                  backgroundSize: "280%",
                  backgroundRepeat: "no-repeat",
                  backgroundColor: "#0c0a07",
                }}
              />
            )}

            {/* Thumbnail strip — only shown when sub images exist */}
            {product.subImages?.length > 0 && (
              <div className="mt-3 flex gap-2 overflow-x-auto py-1 px-1 [&::-webkit-scrollbar]:hidden">
                {/* Main image thumbnail */}
                <button
                  onClick={() => setActiveImg(null)}
                  className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 ${
                    !activeImg
                      ? "outline outline-2 outline-gold-400 outline-offset-2 opacity-100"
                      : "outline outline-2 outline-transparent outline-offset-2 opacity-50 hover:opacity-80"
                  }`}
                >
                  <LuxImage src={fileUrl(product.image) || product.image} alt="" className="w-full h-full object-cover" />
                </button>
                {/* Sub image thumbnails */}
                {product.subImages.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(img)}
                    className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden transition-all duration-200 ${
                      activeImg === img
                        ? "outline outline-2 outline-gold-400 outline-offset-2 opacity-100"
                        : "outline outline-2 outline-transparent outline-offset-2 opacity-50 hover:opacity-80"
                    }`}
                  >
                    <LuxImage src={fileUrl(img) || img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Stock badge */}
            <div className="mt-3 flex justify-center">
              <span className="inline-flex items-center gap-1.5 bg-white/6 gold-hairline rounded-full px-3 py-1.5 text-[11px] font-medium text-ivory/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                {product.stock} {t("product.units")} {t("product.available")}
              </span>
            </div>
          </div>

          {/* RIGHT — product info */}
          <div className="pt-6 lg:pt-0 space-y-6">

            {/* Brand + Title */}
            <div>
              <p className="text-[11px] font-bold tracking-[0.35em] uppercase text-gold-400/70 mb-2">
                {product.brand}
              </p>
              <h1 className="serif text-[24px] lg:text-[28px] font-bold text-ivory leading-snug">
                {product.title}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2.5">
              <Stars rating={product.rating} />
              <span className="text-[13px] font-semibold text-gold-300">{product.rating}</span>
              <span className="text-[12px] text-ivory/35">· {product.reviewCount} {t("product.reviews")}</span>
              <span className="ml-auto text-[11px] font-medium text-ivory/40 bg-white/6 px-2.5 py-1 rounded-full border border-white/10">
                {t(`cat.${product.category}`)}
              </span>
            </div>

            <div className="h-px bg-gold-400/10" />

            {/* Price */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-ivory/25 mb-2">{t("product.pricing")}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[32px] font-bold gold-text tracking-tight leading-none">{fmtNative(product.retail, currency.code)}</span>
                {product.onSale && product.originalPrice > product.retail && (
                  <span className="text-[18px] text-ivory/35 line-through leading-none">{fmtNative(product.originalPrice, currency.code)}</span>
                )}
              </div>
            </div>

            <div className="h-px bg-gold-400/10" />

            {/* Description */}
            <div>
              <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-ivory/25 mb-3">{t("product.description")}</p>
              <p className="text-[14px] text-ivory/60 leading-[1.8]">{product.desc}</p>
            </div>

            <div className="h-px bg-gold-400/10" />

            {/* Qty + CTA (desktop) */}
            <div className="hidden lg:block space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-ivory/25 mb-2">{t("product.qty")}</p>
                  <div className="flex items-center bg-white/5 gold-hairline rounded-xl overflow-hidden w-fit">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1}
                      className="w-10 h-10 flex items-center justify-center text-ivory/50 hover:text-ivory hover:bg-white/10 active:scale-95 transition disabled:opacity-25">
                      <Icon name="minus" size={13} />
                    </button>
                    <span className="serif text-[17px] font-bold text-ivory w-10 text-center select-none">{qty}</span>
                    <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))} disabled={qty >= product.stock}
                      className="w-10 h-10 flex items-center justify-center text-ivory/50 hover:text-ivory hover:bg-white/10 active:scale-95 transition disabled:opacity-25">
                      <Icon name="plus" size={13} />
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-ivory/25 mb-2">{t("product.total")}</p>
                  <p className="text-[28px] font-bold gold-text tracking-tight leading-none">{fmtNative(total, currency.code)}</p>
                </div>
              </div>
              <button onClick={confirmPurchase} disabled={purchasing}
                className="w-full h-[52px] flex items-center justify-center gap-2.5 text-[15px] font-semibold rounded-xl disabled:opacity-60 glass-dark gold-hairline text-ivory hover:bg-white/12 transition active:scale-[0.98]">
                <Icon name="bag" size={17} />
                {purchasing ? t("common.loading") : t("product.addToCart")}
              </button>
              <button onClick={buyNow} disabled={purchasing}
                className="w-full h-[52px] flex items-center justify-center gap-2.5 text-[15px] font-semibold rounded-xl disabled:opacity-60 bg-gradient-to-b from-gold-300 to-gold-600 text-ink-900 hover:brightness-110 transition active:scale-[0.98]">
                <Icon name="zap" size={17} />
                {t("buy.buyNow")}
              </button>

              {/* Sold by — shop info is returned directly in the product listing response */}
              {product.shopName && (
                <p className="text-[13px] text-ivory/45">
                  {t("product.soldBy")}{" "}
                  <Link href={`/products?shopId=${product.shopId}`} className="text-gold-300 hover:text-gold-200 transition underline underline-offset-2">
                    {product.shopName}
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Similar products ─────────────────────────────────────────── */}
      {similar.length > 0 && (
        <div className="px-5 lg:px-12 py-10 border-t border-gold-400/10">
          <h2 className="serif text-[20px] font-bold text-ivory mb-6">{t("product.similarProducts")}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-5">
            {similar.map((p) => (
              <SimilarCard
                key={`${p.id}-${p.inventoryId}`}
                p={p}
                currency={currency}
                t={t}
                onBuyNow={openBuyNow}
                onAddToCart={addSimilarToCart}
                addingToCart={similarAddingIds.has(p.inventoryId)}
                hasSession={!!session}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Lightbox (portal → body, bypasses all stacking contexts) ── */}
      {lightbox && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-ivory flex items-center justify-center transition z-10"
            onClick={() => setLightbox(false)}
          >
            <Icon name="close" size={18} />
          </button>

          {/* Counter */}
          {allImages.length > 1 && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-ivory/50 text-[13px] font-medium tracking-wide z-10">
              {lbIdx + 1} / {allImages.length}
            </div>
          )}

          {/* Image */}
          <div
            className="flex items-center justify-center w-full h-full px-16 py-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fileUrl(allImages[lbIdx]) || allImages[lbIdx]}
              alt={product.title}
              className="max-w-full max-h-[85vh] object-contain rounded-xl select-none"
              draggable={false}
            />
          </div>

          {/* Prev */}
          {allImages.length > 1 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/22 gold-hairline text-ivory flex items-center justify-center transition active:scale-95 z-10"
              onClick={(e) => { e.stopPropagation(); setLbIdx((i) => (i - 1 + allImages.length) % allImages.length); }}
            >
              <Icon name="chevronLeft" size={22} />
            </button>
          )}

          {/* Next */}
          {allImages.length > 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 hover:bg-white/22 gold-hairline text-ivory flex items-center justify-center transition active:scale-95 z-10"
              onClick={(e) => { e.stopPropagation(); setLbIdx((i) => (i + 1) % allImages.length); }}
            >
              <Icon name="chevronRight" size={22} />
            </button>
          )}

          {/* Dot indicators */}
          {allImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10"
              onClick={(e) => e.stopPropagation()}>
              {allImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setLbIdx(i)}
                  className={`h-2 rounded-full transition-all duration-200 ${
                    i === lbIdx ? "w-6 bg-gold-400" : "w-2 bg-white/30 hover:bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>,
        document.body
      )}

      {/* ── Mobile fixed CTA ─────────────────────────────────────────── */}
      <div className="fixed bottom-16 inset-x-0 w-full lg:hidden z-30 glass-dark border-t border-gold-400/15 px-4 py-3">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          <div className="flex items-center gap-1.5 bg-white/5 gold-hairline rounded-2xl px-2.5 h-[52px] shrink-0">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-8 h-8 rounded-full bg-white/8 text-ivory flex items-center justify-center active:scale-95 transition">
              <Icon name="minus" size={13} />
            </button>
            <span className="serif text-[17px] font-bold text-ivory w-6 text-center select-none">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
              className="w-8 h-8 rounded-full bg-white/8 text-ivory flex items-center justify-center active:scale-95 transition">
              <Icon name="plus" size={13} />
            </button>
          </div>
          {/* Buy Now */}
          <button onClick={buyNow} disabled={purchasing}
            className="flex-1 h-[52px] flex items-center justify-center gap-1.5 text-[13px] font-bold rounded-2xl disabled:opacity-60 bg-gradient-to-b from-gold-300 to-gold-600 text-ink-900 hover:brightness-110 transition active:scale-95">
            <Icon name="zap" size={16} />
            {t("buy.buyNow")}
          </button>
          {/* Add to Cart */}
          <button onClick={confirmPurchase} disabled={purchasing}
            className="flex-1 h-[52px] flex items-center justify-center gap-1.5 text-[13px] font-semibold rounded-2xl disabled:opacity-60 glass-dark gold-hairline text-ivory hover:bg-white/12 transition active:scale-[0.98]">
            <Icon name="bag" size={15} />
            {purchasing ? t("common.loading") : t("product.addToCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
