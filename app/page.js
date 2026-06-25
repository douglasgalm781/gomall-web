"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TRUST_BADGES,
  HERO_MODEL,
  CATEGORY_ICONS,
  CATEGORY_GRADIENTS,
  DEFAULT_CATEGORY_ICON,
  DEFAULT_CATEGORY_GRADIENT,
  categoryLabel,
} from "@/lib/data";
import { api, normalizeProduct, fileUrl } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { useSession } from "@/lib/store";
import { useTapReveal } from "@/lib/useTapReveal";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LuxImage from "@/components/LuxImage";
import SaleBadge from "@/components/SaleBadge";
import { useToast } from "@/components/Toast";
import { useBuyNow } from "@/components/BuyNowProvider";

const BRANDS = [
  "LOUIS VUITTON","HERMÈS","CHANEL","GUCCI","CARTIER",
  "DIOR","BVLGARI","TIFFANY & CO.","ROLEX","PATEK PHILIPPE",
  "VAN CLEEF & ARPELS","PIAGET","CHOPARD","PRADA","BOTTEGA VENETA",
];

const PARTICLES = [
  { left:"8%",  bottom:"22%", dur:"4.2s", delay:"0s"   },
  { left:"18%", bottom:"35%", dur:"5.8s", delay:"0.9s" },
  { left:"30%", bottom:"18%", dur:"3.9s", delay:"1.7s" },
  { left:"50%", bottom:"28%", dur:"6.1s", delay:"0.4s" },
  { left:"65%", bottom:"40%", dur:"4.7s", delay:"2.2s" },
  { left:"78%", bottom:"15%", dur:"5.3s", delay:"1.1s" },
  { left:"88%", bottom:"32%", dur:"3.6s", delay:"0.7s" },
  { left:"42%", bottom:"45%", dur:"7.0s", delay:"3.0s" },
];

export default function HomePage() {
  const router  = useRouter();
  const { t, lang } = useI18n();
  const { currency } = useCurrency();
  const session = useSession();
  const toast   = useToast();
  const buyNow  = useBuyNow();
  const [cat,        setCat]        = useState("all");
  const [catKeys,    setCatKeys]    = useState(["all"]);
  const [products,  setProducts]  = useState([]);
  const [saleProducts, setSaleProducts] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [likedIds,  setLikedIds]  = useState(new Set());
  const [addingIds, setAddingIds] = useState(new Set());
  const [homeCfg,   setHomeCfg]   = useState(null);
  const [shops,     setShops]     = useState([]);
  const [heroIdx,   setHeroIdx]   = useState(0);
  const { onCardClick, actionCls } = useTapReveal();

  useEffect(() => {
    api.get("/config/home").then(setHomeCfg).catch(() => {});
    api.get("/listings/shops").then((d) => setShops(d.shops || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!session) { setLikedIds(new Set()); return; }
    api.get("/likes").then((d) => {
      setLikedIds(new Set((d.items || []).map((p) => p.id)));
    }).catch(() => {});
  }, [session]);

  useEffect(() => {
    api.get("/config/categories").then((d) => {
      setCatKeys(["all", ...(d.items || [])]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ currency: currency.code, pageSize: "10", sale: "1", sort: "discountDesc" });
    if (cat !== "all") params.set("category", cat);
    if (lang === "zh") params.set("lang", "zh");
    api.get(`/listings?${params.toString()}`)
      .then((data) => setSaleProducts((data.items || []).map(normalizeProduct)))
      .catch(() => {});
  }, [currency.code, lang, cat]);

  // Hero slides: the configured hero image followed by a few sale-product shots.
  const heroSlides = [...new Set(
    [homeCfg?.heroImage || HERO_MODEL, ...saleProducts.map((p) => p.image)].filter(Boolean)
  )].slice(0, 6);
  const slideIdx = heroSlides.length ? heroIdx % heroSlides.length : 0;

  // Auto-advance the hero carousel.
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const id = setInterval(() => setHeroIdx((i) => (i + 1) % heroSlides.length), 5000);
    return () => clearInterval(id);
  }, [heroSlides.length]);

  async function toggleLike(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { router.push("/login"); return; }
    try {
      const { liked } = await api.post(`/likes/${productId}`);
      setLikedIds((prev) => {
        const next = new Set(prev);
        liked ? next.add(productId) : next.delete(productId);
        return next;
      });
      toast.success(liked ? t("likes.added") : t("likes.removed"));
    } catch {
      toast.error(t("common.loadFailed"));
    }
  }

  async function addToCart(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { router.push("/login"); return; }
    if (addingIds.has(productId)) return;
    setAddingIds((prev) => new Set(prev).add(productId));
    try {
      const res = await api.post("/cart", { productId, qty: 1 });
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: res.count ?? null } }));
      toast.success(t("cart.addedMsg"));
    } catch {
      toast.error(t("common.loadFailed"));
    } finally {
      setAddingIds((prev) => { const s = new Set(prev); s.delete(productId); return s; });
    }
  }

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ currency: currency.code, pageSize: "36" });
    if (cat !== "all") params.set("category", cat);
    if (lang === "zh") params.set("lang", "zh");
    api
      .get(`/listings?${params.toString()}`)
      .then((data) => {
        const seen = new Set();
        const unique = (data.items || []).filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        setProducts(unique.slice(0, 12).map(normalizeProduct));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [currency.code, cat]);

  const filtered = products;

  return (
    <div className="luxe min-h-screen pb-24 lg:pb-12">

      {/* ── Mobile sticky header ─────────────────────────────────────── */}
      <div className="sticky top-0 z-20 glass-dark px-4 md:px-8 h-16 flex items-center justify-between border-b border-gold-400/15 lg:hidden">
        <div className="flex items-center gap-2">
          <Logo size={30} />
          <span className="serif text-[20px] font-bold text-ivory tracking-wide">
            Go<span className="gold-text">Mall</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/search" className="w-9 h-9 rounded-full gold-hairline bg-white/5 text-gold-300 flex items-center justify-center">
            <Icon name="search" size={18} />
          </Link>
          {session ? (
            <>
              <Link href="/cart" className="w-9 h-9 rounded-full gold-hairline bg-white/5 text-gold-300 flex items-center justify-center">
                <Icon name="bag" size={18} />
              </Link>
              <Link href="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center serif text-[12px] font-bold text-ink-900 ring-1 ring-gold-400/30">
                {(session.account || "").slice(0, 2).toUpperCase()}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="h-8 px-3 rounded-full gold-hairline bg-white/5 text-ivory/80 text-[12px] font-semibold flex items-center">
                {t("login.submit")}
              </Link>
              <Link href="/register" className="h-8 px-3 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[12px] font-bold flex items-center">
                {t("register.submit")}
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">

        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <div className="px-4 md:px-8 lg:px-12 pt-3">
          <div className="group relative rounded-2xl overflow-hidden shadow-lux gold-hairline aspect-[4/5] lg:aspect-auto lg:h-[50vh]">
            {/* Background image carousel — cross-fades between slides */}
            {heroSlides.map((src, i) => (
              <div
                key={i}
                className={`absolute inset-0 transition-opacity duration-[900ms] ease-out ${i === slideIdx ? "opacity-100" : "opacity-0"}`}
              >
                <LuxImage src={src} alt="" className="w-full h-full" label="GOMALL" />
              </div>
            ))}

            {/* Cinematic gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/50 to-black/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Scan-light animation */}
            <div className="scan-light" />

            {/* Floating gold particles */}
            {PARTICLES.map((p, i) => (
              <span
                key={i}
                className="absolute w-1 h-1 rounded-full bg-gold-300/70 particle-rise"
                style={{ left: p.left, bottom: p.bottom, "--dur": p.dur, "--delay": p.delay }}
              />
            ))}

            {/* Decorative grid overlay */}
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                backgroundImage: "linear-gradient(rgba(216,183,106,1) 1px, transparent 1px), linear-gradient(90deg, rgba(216,183,106,1) 1px, transparent 1px)",
                backgroundSize: "40px 40px",
                maskImage: "radial-gradient(ellipse 80% 100% at 80% 50%, transparent 30%, black 80%)",
                WebkitMaskImage: "radial-gradient(ellipse 80% 100% at 80% 50%, transparent 30%, black 80%)",
              }}
            />

            {/* Hero text */}
            <div className="absolute inset-0 flex flex-col justify-center px-8 lg:px-14 max-w-[85%] lg:max-w-[50%]">
              <p className="text-gold-300 text-[10px] tracking-[0.4em] uppercase mb-3 reveal-up" style={{ animationDelay: "0.1s" }}>
                GoMall · Maison de Luxe
              </p>
              <h1 className="serif text-ivory text-[28px] lg:text-[44px] font-bold leading-[1.1] whitespace-pre-line reveal-up" style={{ animationDelay: "0.2s" }}>
                {homeCfg?.heroTitle?.[lang] || t("home.heroTitle")}
              </h1>
              {/* Gold accent line */}
              <div className="w-12 h-[2px] bg-gradient-to-r from-gold-300 to-gold-500 my-3 rounded-full reveal-up" style={{ animationDelay: "0.3s" }} />
              <p className="text-ivory/65 text-[13px] lg:text-[15px] leading-relaxed reveal-up" style={{ animationDelay: "0.35s" }}>
                {homeCfg?.heroSub?.[lang] || t("home.heroSub")}
              </p>
              <Link
                href="/products"
                className="btn-primary inline-flex items-center justify-center gap-2 h-11 px-7 mt-5 w-fit text-[13px] tracking-wide reveal-up"
                style={{ animationDelay: "0.45s" }}
              >
                {t("home.shopNow")} <Icon name="chevronRight" size={15} />
              </Link>
            </div>

            {/* Bottom fade edge */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#0c0a07] to-transparent" />

            {/* Prev / Next — shown on hover */}
            {heroSlides.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous slide"
                  onClick={() => setHeroIdx((i) => (i - 1 + heroSlides.length) % heroSlides.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-dark gold-hairline text-ivory/80 hover:text-gold-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Icon name="chevronLeft" size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Next slide"
                  onClick={() => setHeroIdx((i) => (i + 1) % heroSlides.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full glass-dark gold-hairline text-ivory/80 hover:text-gold-200 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                >
                  <Icon name="chevronRight" size={20} />
                </button>
              </>
            )}

            {/* Carousel dots */}
            {heroSlides.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                {heroSlides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHeroIdx(i)}
                    aria-label={`Slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === slideIdx ? "w-6 bg-gold-300" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Brand marquee ticker ─────────────────────────────────────── */}
        <div className="marquee-wrap mt-4 border-y border-gold-400/10 overflow-hidden bg-black/30 py-3 select-none">
          <div className="flex animate-marquee whitespace-nowrap">
            {[...Array(2)].map((_, ri) => (
              <span key={ri} className="inline-flex items-center">
                {BRANDS.map((brand, bi) => (
                  <span key={`${ri}-${bi}`} className="inline-flex items-center">
                    <span className="text-[10px] tracking-[0.35em] font-semibold text-ivory/28 uppercase px-1">
                      {brand}
                    </span>
                    <span className="marquee-dot" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── Shop by category ─────────────────────────────────────────── */}
        <div className="px-4 md:px-8 lg:px-12 mt-6">
          {/* Section label */}
          <p className="text-[10px] uppercase tracking-[0.35em] text-gold-300/50 font-semibold mb-4 text-center">
            {t("home.shopByCategory") || "Shop by Category"}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5 lg:gap-3">
            {catKeys.map((key) => {
              const icon = CATEGORY_ICONS[key] || DEFAULT_CATEGORY_ICON;
              const grad = CATEGORY_GRADIENTS[key] || DEFAULT_CATEGORY_GRADIENT;
              const active = cat === key;
              return (
                <button
                  key={key}
                  onClick={() => setCat(key)}
                  className={`relative py-4 flex flex-col items-center gap-2.5 rounded-2xl transition-all duration-300 group active:scale-95 overflow-hidden ${
                    active
                      ? "border-glow-active shadow-gold border border-gold-400/50 bg-gold-400/10"
                      : "border border-white/8 bg-white/[0.03] hover:border-gold-400/30 hover:bg-white/[0.06]"
                  }`}
                >
                  {/* Gradient glow bg */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${grad} opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${active ? "!opacity-100" : ""}`} />
                  <span className={`relative w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    active
                      ? "bg-gold-400/25 text-gold-200 shadow-gold"
                      : "bg-white/5 text-gold-300/70 group-hover:bg-gold-400/15 group-hover:text-gold-200"
                  }`}>
                    <Icon name={icon} size={18} />
                  </span>
                  <span className={`relative text-[10px] font-semibold tracking-wide text-center leading-tight ${
                    active ? "text-gold-200" : "text-ivory/60 group-hover:text-ivory/90"
                  }`}>
                    {categoryLabel(t, key)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── On Sale ──────────────────────────────────────────────────── */}
        {saleProducts.length > 0 && (
          <div className="px-4 md:px-8 lg:px-12 mt-9">
            <div className="flex items-end justify-between mb-5">
              <div>
                <p className="text-[10px] uppercase tracking-[0.35em] text-rose-400/60 font-semibold mb-1">
                  {t("home.onSale")}
                </p>
                <h2 className="serif text-[22px] font-bold text-ivory">{t("home.onSaleTitle")}</h2>
              </div>
              <Link href="/products?sale=1" className="flex items-center gap-1.5 text-[12px] text-gold-300/70 hover:text-gold-300 transition font-medium tracking-wide border-b border-gold-400/20 hover:border-gold-400/50 pb-0.5">
                {t("home.shopTheSale")} <Icon name="chevronRight" size={13} />
              </Link>
            </div>

            <div className="gold-divider mb-5" />

            <div className="flex gap-3 md:gap-4 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
              {saleProducts.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  onClick={onCardClick(p.id, (p.stock ?? 0) > 0)}
                  className="group shrink-0 w-[150px] sm:w-[180px] lux-card card-cascade"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="card-dark overflow-hidden h-full">
                    <div className="relative overflow-hidden">
                      <LuxImage
                        src={p.image}
                        alt={p.brand}
                        className="aspect-square group-hover:scale-108 transition-transform duration-700"
                        label={p.brand}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                      {/* Gold shimmer line on hover */}
                      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <SaleBadge onSale={p.onSale} price={p.retail} originalPrice={p.originalPrice} />

                      {/* Wishlist */}
                      <button
                        onClick={(e) => toggleLike(e, p.id)}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full glass-dark flex items-center justify-center transition-all active:scale-90 ${
                          likedIds.has(p.id) ? "text-red-400 opacity-100" : "text-ivory/50 opacity-0 group-hover:opacity-100 hover:text-red-400"
                        }`}
                      >
                        <Icon name="heart" size={14} fill={likedIds.has(p.id) ? "currentColor" : "none"} strokeWidth={likedIds.has(p.id) ? 0 : 1.5} />
                      </button>

                      {/* Buy now + Add to cart */}
                      {(p.stock ?? 0) > 0 && (
                        <div className={`absolute bottom-2 left-2 right-2 flex flex-col gap-1.5 ${actionCls(p.id)}`}>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); buyNow(p); }}
                            className="h-8 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-gold"
                          >
                            <Icon name="zap" size={13} /> {t("buy.buyNow")}
                          </button>
                          <button
                            onClick={(e) => addToCart(e, p.id)}
                            disabled={addingIds.has(p.id)}
                            className="h-8 rounded-lg glass-dark gold-hairline text-gold-200 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 hover:text-gold-100 transition"
                          >
                            {addingIds.has(p.id)
                              ? <><div className="w-3 h-3 border-2 border-gold-200/30 border-t-gold-200 rounded-full animate-spin" /> {t("products.adding")}</>
                              : <><Icon name="bag" size={13} /> {t("product.addToCart")}</>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-gold-300/75 text-[9px] tracking-[0.22em] uppercase truncate mb-0.5">{p.brand}</div>
                      <p className="text-ivory/85 text-[11px] leading-snug line-clamp-2 min-h-[2.4em]">{p.title}</p>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-gold-200 text-[13px] font-bold tracking-tight">{fmtNative(p.retail, currency.code)}</span>
                        {p.onSale && p.originalPrice > p.retail && (
                          <span className="text-ivory/30 text-[11px] line-through">{fmtNative(p.originalPrice, currency.code)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Product grid ─────────────────────────────────────────────── */}
        <div className="px-4 md:px-8 lg:px-12 mt-7">
          {/* Section header */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold-300/50 font-semibold mb-1">
                {t("home.featured") || "Featured Collection"}
              </p>
              <h2 className="serif text-[22px] font-bold text-ivory">{t("home.newArrivals") || "New Arrivals"}</h2>
            </div>
            <Link href="/products" className="flex items-center gap-1.5 text-[12px] text-gold-300/70 hover:text-gold-300 transition font-medium tracking-wide border-b border-gold-400/20 hover:border-gold-400/50 pb-0.5">
              {t("home.viewAll")} <Icon name="chevronRight" size={13} />
            </Link>
          </div>

          {/* Thin gold divider */}
          <div className="gold-divider mb-5" />

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card-dark overflow-hidden animate-pulse">
                  <div className="aspect-square bg-white/5" />
                  <div className="p-3 space-y-2">
                    <div className="h-2 bg-white/5 rounded w-1/2" />
                    <div className="h-3 bg-white/5 rounded" />
                    <div className="h-3 bg-white/5 rounded w-4/5" />
                    <div className="h-4 bg-white/5 rounded w-1/3 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Icon name="bag" size={32} className="text-gold-300/20 mx-auto mb-2" />
              <p className="text-ivory/40 text-sm">No products in this category yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {filtered.slice(0, 12).map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.id}`}
                  onClick={onCardClick(p.id, (p.stock ?? 0) > 0)}
                  className="group lux-card card-cascade"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <div className="card-dark overflow-hidden h-full">
                    <div className="relative overflow-hidden">
                      <LuxImage
                        src={p.image}
                        alt={p.brand}
                        className="aspect-square group-hover:scale-108 transition-transform duration-700"
                        label={p.brand}
                      />
                      {/* Overlay gradient on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                      {/* Gold shimmer line on hover */}
                      <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <SaleBadge onSale={p.onSale} price={p.retail} originalPrice={p.originalPrice} />

                      {/* Wishlist */}
                      <button
                        onClick={(e) => toggleLike(e, p.id)}
                        className={`absolute top-2 right-2 w-7 h-7 rounded-full glass-dark flex items-center justify-center transition-all active:scale-90 ${
                          likedIds.has(p.id) ? "text-red-400 opacity-100" : "text-ivory/50 opacity-0 group-hover:opacity-100 hover:text-red-400"
                        }`}
                      >
                        <Icon name="heart" size={14} fill={likedIds.has(p.id) ? "currentColor" : "none"} strokeWidth={likedIds.has(p.id) ? 0 : 1.5} />
                      </button>

                      {/* Buy now + Add to cart */}
                      {(p.stock ?? 0) > 0 && (
                        <div className={`absolute bottom-2 left-2 right-2 flex flex-col gap-1.5 ${actionCls(p.id)}`}>
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); buyNow(p); }}
                            className="h-8 rounded-lg bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition shadow-gold"
                          >
                            <Icon name="zap" size={13} /> {t("buy.buyNow")}
                          </button>
                          <button
                            onClick={(e) => addToCart(e, p.id)}
                            disabled={addingIds.has(p.id)}
                            className="h-8 rounded-lg glass-dark gold-hairline text-gold-200 text-[11px] font-bold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 hover:text-gold-100 transition"
                          >
                            {addingIds.has(p.id)
                              ? <><div className="w-3 h-3 border-2 border-gold-200/30 border-t-gold-200 rounded-full animate-spin" /> {t("products.adding")}</>
                              : <><Icon name="bag" size={13} /> {t("product.addToCart")}</>
                            }
                          </button>
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <div className="text-gold-300/75 text-[9px] tracking-[0.22em] uppercase truncate mb-0.5">{p.brand}</div>
                      <p className="text-ivory/85 text-[11px] leading-snug line-clamp-2 min-h-[2.4em]">{p.title}</p>
                      <div className="text-gold-200 text-[13px] font-bold mt-1.5 tracking-tight">{fmtNative(p.retail, currency.code)}</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* ── Shop by Store ────────────────────────────────────────────── */}
        {shops.length > 0 && (
          <div className="px-4 md:px-8 lg:px-12 mt-12">
            <div className="mb-2">
              <p className="text-[10px] uppercase tracking-[0.35em] text-gold-300/50 font-semibold mb-1">
                {t("home.curatedBy") || "Curated by"}
              </p>
              <h2 className="serif text-[22px] font-bold text-ivory">{t("home.shopByStore") || "Shop by Store"}</h2>
            </div>

            <div className="gold-divider mb-5" />

            {(() => {
              const featured = shops.slice(0, 5);
              const n = featured.length;
              // Bento spans tuned so the 4-col desktop grid fills cleanly for 1–5 stores.
              const tileSpan = (i) => {
                if (n === 1) return "col-span-2 lg:col-span-4 row-span-2";
                if (n === 2) return "col-span-2 row-span-2";
                if (i === 0) return "col-span-2 row-span-2";        // featured (most products)
                if (n === 3) return "col-span-2 row-span-1";        // two wide tiles stack right
                if (n === 4) return i === 1 ? "col-span-2 row-span-1" : "row-span-1";
                return "row-span-1";                                // n === 5: four squares
              };
              return (
                <div className="grid grid-cols-2 lg:grid-cols-4 auto-rows-[180px] sm:auto-rows-[210px] gap-3 sm:gap-4">
                  {featured.map((shop, i) => (
                    <Link
                      key={shop.id}
                      href={`/products?shopId=${shop.id}`}
                      className={`group relative overflow-hidden rounded-2xl gold-hairline card-cascade ${tileSpan(i)}`}
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      {/* full-bleed store image */}
                      {shop.logoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fileUrl(shop.logoUrl)}
                          alt={shop.name}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.07]"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#1c1813] via-[#15110a] to-[#0c0a07] flex items-center justify-center">
                          <Icon name="store" size={n >= 3 && i === 0 ? 48 : 30} className="text-gold-300/60" />
                        </div>
                      )}

                      {/* readability gradient — always present, deepens on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent transition-colors duration-500 group-hover:from-black/90" />
                      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(199,154,60,0.12),transparent_55%)] opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* product-count chip (top-left) */}
                      <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_4px_rgba(52,211,153,0.7)]" />
                        <span className="text-[10px] font-semibold text-ivory/90">{t("home.storeProducts", { n: shop.productCount })}</span>
                      </div>

                      {/* content (bottom) */}
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <h3 className={`serif font-bold text-ivory leading-tight drop-shadow group-hover:text-gold-200 transition-colors duration-300 ${n >= 3 && i === 0 ? "text-[20px]" : "text-[15px]"}`}>
                          {shop.name}
                        </h3>

                        {/* hover-revealed details */}
                        <div className="overflow-hidden max-h-0 opacity-0 group-hover:max-h-44 group-hover:opacity-100 transition-all duration-500 ease-out">
                          {shop.description && (
                            <p className="text-[11px] text-ivory/70 mt-1.5 line-clamp-2 leading-relaxed">{shop.description}</p>
                          )}
                          {(shop.telegram || shop.phone) && (
                            <p className="text-[10px] text-ivory/45 mt-1.5 truncate">
                              {shop.telegram ? `TG ${shop.telegram}` : shop.phone}
                            </p>
                          )}
                          <span className="inline-flex items-center gap-1 mt-2.5 text-[11px] font-semibold text-gold-300">
                            {t("home.viewStore")}
                            <Icon name="chevronRight" size={13} className="group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

      </div>{/* end inner content (max-w-[1600px]) */}

      {/* ── Trust strip — full viewport width ────────────────────────── */}
      <div className="mt-12 relative">
        <div className="gold-divider" />
        <div className="trust-section py-6 lg:py-8">
          <p className="text-center text-[10px] uppercase tracking-[0.4em] text-gold-300/40 font-semibold mb-6">
            {t("trust.title") || "The GoMall Promise"}
          </p>
          <div className="max-w-[1600px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-around gap-10 sm:gap-4">
            {TRUST_BADGES.map((b, i) => (
              <div
                key={b.key}
                className="flex flex-col items-center text-center gap-4 flex-1 card-cascade"
                style={{ animationDelay: `${i * 90}ms` }}
              >
                {/* Icon — bare glow, no box */}
                <div className="relative flex items-center justify-center w-20 h-20">
                  <div className="absolute inset-0 rounded-full bg-gold-400/10 blur-2xl scale-150" />
                  <div className="relative w-[72px] h-[72px] rounded-full bg-gradient-to-br from-gold-400/12 to-gold-600/6 flex items-center justify-center">
                    <Icon name={b.icon} size={34} className="text-gold-300/80" strokeWidth={1.5} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-[13px] font-semibold text-ivory/80 tracking-wide leading-snug">{t(`trust.${b.key}`)}</p>
                  <p className="text-[11px] text-ivory/35 leading-snug">{t(`trust.${b.key}Sub`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="gold-divider" />
      </div>

    </div>
  );
}
