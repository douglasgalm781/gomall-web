"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { categoryLabel } from "@/lib/data";
import { api, normalizeProduct } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { useSession } from "@/lib/store";
import { useToast } from "@/components/Toast";
import { useBuyNow } from "@/components/BuyNowProvider";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";
import Pagination from "@/components/Pagination";
import SaleBadge from "@/components/SaleBadge";

const PAGE_SIZE = 24;

const SORTS = [
  { key: "newest",     labelKey: "products.sortNewest",     api: "newest"       },
  { key: "priceAsc",   labelKey: "products.sortPriceAsc",   api: "retailAsc"    },
  { key: "priceDesc",  labelKey: "products.sortPriceDesc",  api: "retailDesc"   },
  { key: "discount",   labelKey: "products.sortDiscount",   api: "discountDesc" },
  { key: "endingSoon", labelKey: "products.sortEndingSoon", api: "endingSoon"   },
];

const Skeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
    {[...Array(PAGE_SIZE)].map((_, i) => (
      <div key={i} className="card-dark overflow-hidden animate-pulse">
        <div className="aspect-[4/5] bg-white/5" />
        <div className="p-4 space-y-2">
          <div className="h-2 bg-white/5 rounded w-1/3" />
          <div className="h-3 bg-white/5 rounded" />
          <div className="h-3 bg-white/5 rounded w-3/4" />
          <div className="h-5 bg-white/5 rounded w-2/5 mt-2" />
        </div>
      </div>
    ))}
  </div>
);

function ProductsContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { t, lang }  = useI18n();
  const { currency } = useCurrency();
  const session      = useSession();
  const searchRef    = useRef(null);
  const sortRef      = useRef(null);
  const toast        = useToast();
  const didMount     = useRef(false);

  // All filter state derived from URL — changing the URL re-renders and re-fetches
  const cat    = searchParams.get("cat")    || "all";
  const shopId = searchParams.get("shopId") || null;
  const urlQ   = searchParams.get("q")      || "";
  const sort   = searchParams.get("sort")   || "newest";
  const sale   = searchParams.get("sale")   === "1";
  const page   = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  // Local state: only the raw search input (debounced to URL)
  const [inputQuery, setInputQuery] = useState(urlQ);
  const [catKeys,    setCatKeys]    = useState(["all"]);
  const [shops,      setShops]      = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [fetching,   setFetching]   = useState(false);
  const [total,      setTotal]      = useState(0);
  const [likedIds,   setLikedIds]   = useState(new Set());
  const [addingIds,  setAddingIds]  = useState(new Set());
  const [sortOpen,   setSortOpen]   = useState(false);
  const buyNow = useBuyNow();

  // Always read from window.location to avoid stale closures in async callbacks
  function setParam(key, value) {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : searchParams.toString()
    );
    if (value && value !== "all" && value !== "newest") {
      params.set(key, String(value));
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }

  function gotoPage(p) {
    const params = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : searchParams.toString()
    );
    if (p > 1) params.set("page", String(p));
    else params.delete("page");
    router.replace(`/products?${params.toString()}`, { scroll: false });
  }

  function clearFilters() {
    setInputQuery("");
    router.replace("/products", { scroll: false });
  }

  // Sync input box when URL changes (browser back/forward)
  useEffect(() => {
    setInputQuery(urlQ);
  }, [urlQ]);

  useEffect(() => {
    api.get("/config/categories").then((d) => {
      setCatKeys(["all", ...(d.items || [])]);
    }).catch(() => {});
  }, []);

  // Debounce: update URL ?q= after typing stops
  useEffect(() => {
    if (!didMount.current) { didMount.current = true; return; }
    const timer = setTimeout(() => setParam("q", inputQuery.trim()), 350);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputQuery]);

  // Close sort dropdown on outside click
  useEffect(() => {
    function handler(e) {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch shop list for sidebar / mobile filter
  useEffect(() => {
    api.get("/listings/shops").then((d) => setShops(d.shops || [])).catch(() => {});
  }, []);

  // Fetch liked product IDs
  useEffect(() => {
    if (!session) { setLikedIds(new Set()); return; }
    api.get("/likes").then((d) => {
      setLikedIds(new Set((d.items || []).map((p) => p.id)));
    }).catch(() => {});
  }, [session]);

  async function toggleLike(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) return;
    try {
      const { liked } = await api.post(`/likes/${productId}`);
      setLikedIds((prev) => {
        const next = new Set(prev);
        liked ? next.add(productId) : next.delete(productId);
        return next;
      });
    } catch {}
  }

  // Key is inventoryId — each (product, shop) listing is tracked independently
  async function addToCart(e, inventoryId) {
    e.preventDefault();
    e.stopPropagation();
    if (!session) { router.push("/login"); return; }
    if (addingIds.has(inventoryId)) return;
    setAddingIds((prev) => new Set(prev).add(inventoryId));
    try {
      const res = await api.post("/cart", { inventoryId, qty: 1 });
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: res.count ?? null } }));
      toast.success(t("cart.addedMsg"));
    } catch {
      toast.error(t("common.loadFailed"));
    } finally {
      setAddingIds((prev) => { const s = new Set(prev); s.delete(inventoryId); return s; });
    }
  }

  // Fetch products — depends on ALL URL-derived values, so store/category/search/sort
  // changes all trigger re-fetches automatically via URL change → re-render
  useEffect(() => {
    const firstLoad = products.length === 0;
    if (firstLoad) setLoading(true);
    else setFetching(true);

    const params = new URLSearchParams({
      currency: currency.code,
      page,
      pageSize: PAGE_SIZE,
    });
    if (cat !== "all") params.set("category", cat);
    if (urlQ.trim()) params.set("q", urlQ.trim());
    if (shopId) params.set("shopId", shopId);
    if (sale) params.set("sale", "1");
    const apiSort = SORTS.find((s) => s.key === sort)?.api;
    if (apiSort) params.set("sort", apiSort);
    if (lang === "zh") params.set("lang", "zh");

    api
      .get(`/listings?${params.toString()}`)
      .then((data) => {
        setProducts((data.items || []).map(normalizeProduct));
        setTotal(data.total || 0);
      })
      .catch(() => {})
      .finally(() => { setLoading(false); setFetching(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, cat, sort, urlQ, shopId, sale, currency.code]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="luxe min-h-screen pb-16">

      {/* ── Products header — full viewport width ───────────────── */}
      <div className="products-header relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-gold-400/6 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full bg-gold-600/4 blur-2xl pointer-events-none" />
        {/* Left / right edge gradients */}
        <div className="absolute left-0 inset-y-0 w-32 bg-gradient-to-r from-gold-400/4 to-transparent pointer-events-none" />
        <div className="absolute right-0 inset-y-0 w-32 bg-gradient-to-l from-gold-400/4 to-transparent pointer-events-none" />
        {/* Inner content constrained to max-w */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pt-6 pb-5 relative">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase mb-4">
            <Link href="/" className="text-ivory/35 hover:text-gold-300 transition">{t("nav.home")}</Link>
            <span className="text-gold-400/40">›</span>
            <span className="text-gold-300/70 font-semibold">{t("nav.products")}</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto">
        {/* ── Layout: sidebar + grid ───────────────────────────────── */}
        <div className="flex gap-0 lg:gap-8 px-4 md:px-8 lg:px-12 pt-6">

          {/* ── Sidebar (desktop) ──────────────────────────────────── */}
          <aside className="hidden lg:block w-52 xl:w-56 shrink-0">
            <div className="sticky top-6 space-y-5">

              {/* Category */}
              <div className="sidebar-glass">
                <p className="text-[9px] uppercase tracking-[0.3em] text-gold-300/45 font-bold mb-3">{t("products.category")}</p>
                <nav className="space-y-0.5">
                  {catKeys.map((key) => {
                    const active = cat === key;
                    return (
                      <button key={key} onClick={() => setParam("cat", key)}
                        className={`w-full text-left px-3 py-2.5 rounded-xl text-[12.5px] transition-all flex items-center justify-between ${
                          active
                            ? "bg-gold-400/15 text-gold-200 font-semibold border border-gold-400/30"
                            : "text-ivory/50 hover:text-ivory/90 hover:bg-white/5"
                        }`}
                      >
                        {categoryLabel(t, key)}
                        {active && (
                          <span className="w-5 h-5 rounded-full bg-gold-400/20 flex items-center justify-center">
                            <Icon name="check" size={11} className="text-gold-300" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* On Sale */}
              <div className="sidebar-glass">
                <button
                  onClick={() => setParam("sale", sale ? "" : "1")}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-[12.5px] transition-all flex items-center justify-between ${
                    sale
                      ? "bg-rose-500/15 text-rose-300 font-semibold border border-rose-400/30"
                      : "text-ivory/50 hover:text-ivory/90 hover:bg-white/5"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon name="zap" size={13} />
                    {t("products.onSale")}
                  </span>
                  {sale && (
                    <span className="w-5 h-5 rounded-full bg-rose-400/20 flex items-center justify-center">
                      <Icon name="check" size={11} className="text-rose-300" />
                    </span>
                  )}
                </button>
              </div>

              {/* Store */}
              {shops.length > 0 && (
                <div className="sidebar-glass">
                  <p className="text-[9px] uppercase tracking-[0.3em] text-gold-300/45 font-bold mb-3">{t("products.storeFilter")}</p>
                  <nav className="space-y-0.5">
                    <button
                      onClick={() => setParam("shopId", null)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-[12.5px] transition-all flex items-center justify-between ${
                        !shopId ? "bg-gold-400/15 text-gold-200 font-semibold border border-gold-400/30" : "text-ivory/50 hover:text-ivory/90 hover:bg-white/5"
                      }`}
                    >
                      {t("products.allStores")}
                      {!shopId && (
                        <span className="w-5 h-5 rounded-full bg-gold-400/20 flex items-center justify-center">
                          <Icon name="check" size={11} className="text-gold-300" />
                        </span>
                      )}
                    </button>
                    {shops.map((s) => {
                      const active = shopId === String(s.id);
                      return (
                        <button key={s.id} onClick={() => setParam("shopId", String(s.id))}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-[12.5px] transition-all flex items-center justify-between ${
                            active ? "bg-gold-400/15 text-gold-200 font-semibold border border-gold-400/30" : "text-ivory/50 hover:text-ivory/90 hover:bg-white/5"
                          }`}
                        >
                          <span className="truncate">{s.name}</span>
                          {active && (
                            <span className="w-5 h-5 rounded-full bg-gold-400/20 flex items-center justify-center shrink-0">
                              <Icon name="check" size={11} className="text-gold-300" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              )}

            </div>
          </aside>

          {/* ── Main content ────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Mobile search bar */}
            <div className="lg:hidden relative mb-3">
              <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory/35 pointer-events-none" />
              <input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder={t("search.placeholder")}
                className="w-full h-10 bg-white/5 gold-hairline rounded-2xl text-[13px] text-ivory placeholder-ivory/30 pl-10 pr-9 outline-none focus:border-gold-400/50 transition"
              />
              {inputQuery && (
                <button onClick={() => { setInputQuery(""); setParam("q", ""); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/30 hover:text-ivory/60 transition">
                  <Icon name="close" size={15} />
                </button>
              )}
            </div>

            {/* Mobile filter bar */}
            <div className="lg:hidden mb-5 space-y-2">
              <div className="flex gap-2 overflow-x-auto scrollbar-none">
                <button onClick={() => setParam("sale", sale ? "" : "1")}
                  className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition flex items-center gap-1 ${
                    sale ? "bg-gradient-to-b from-rose-500 to-red-700 text-white" : "gold-hairline bg-white/5 text-ivory/65"
                  }`}
                >
                  <Icon name="zap" size={12} /> {t("products.onSale")}
                </button>
                {catKeys.map((key) => (
                  <button key={key} onClick={() => setParam("cat", key)}
                    className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition ${
                      cat === key ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900" : "gold-hairline bg-white/5 text-ivory/65"
                    }`}
                  >
                    {categoryLabel(t, key)}
                  </button>
                ))}
              </div>
              {shops.length > 0 && (
                <div className="flex gap-2 overflow-x-auto scrollbar-none">
                  <button onClick={() => setParam("shopId", null)}
                    className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition ${
                      !shopId ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900" : "gold-hairline bg-white/5 text-ivory/65"
                    }`}
                  >
                    All Stores
                  </button>
                  {shops.map((s) => (
                    <button key={s.id} onClick={() => setParam("shopId", String(s.id))}
                      className={`shrink-0 h-8 px-3.5 rounded-full text-[12px] font-medium transition ${
                        shopId === String(s.id) ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900" : "gold-hairline bg-white/5 text-ivory/65"
                      }`}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort combobox + item count row */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] text-ivory/40">
                {loading ? "…" : t("products.items").replace("{n}", total)}
              </span>
              <div ref={sortRef} className="relative">
                <button
                  type="button"
                  onClick={() => setSortOpen((v) => !v)}
                  className="h-9 pl-8 pr-8 rounded-xl bg-white/5 gold-hairline text-[13px] text-ivory/80 outline-none cursor-pointer hover:border-gold-400/50 transition flex items-center"
                >
                  <Icon name="trending" size={13} className="absolute left-3 text-gold-300/60 pointer-events-none" />
                  {t(SORTS.find((s) => s.key === sort)?.labelKey)}
                  <Icon name="chevronDown" size={13} className="absolute right-3 text-ivory/40 pointer-events-none" />
                </button>
                {sortOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-[#1a1510] border border-gold-400/25 rounded-xl py-1.5 min-w-[180px] z-50 shadow-lux">
                    {SORTS.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        onClick={() => { setParam("sort", s.key); setSortOpen(false); }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-[13px] transition ${
                          sort === s.key
                            ? "text-gold-300 bg-gold-400/12 font-semibold"
                            : "text-ivory/70 hover:bg-white/6 hover:text-ivory"
                        }`}
                      >
                        {t(s.labelKey)}
                        {sort === s.key && <Icon name="check" size={12} className="text-gold-400" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Active store indicator (mobile) */}
            {shopId && shops.length > 0 && (
              <div className="lg:hidden mb-3 flex items-center gap-2">
                <span className="text-[12px] text-ivory/40">
                  {shops.find((s) => String(s.id) === shopId)?.name ?? t("products.storeFilter")}
                </span>
                <button onClick={() => setParam("shopId", null)} className="text-[11px] text-gold-300/70 hover:text-gold-300 transition underline">
                  {t("products.clear")}
                </button>
              </div>
            )}

            {/* Search query indicator */}
            {urlQ && (
              <div className="mb-4 flex items-center gap-2">
                <span className="text-[12px] text-ivory/40">
                  {t("products.resultsFor")} <span className="text-ivory/70 font-medium">"{urlQ}"</span>
                  {!loading && !fetching && ` — ${total} ${t("products.found")}`}
                </span>
                <button onClick={() => { setInputQuery(""); setParam("q", ""); }} className="text-[11px] text-gold-300/70 hover:text-gold-300 transition underline">
                  {t("products.clear")}
                </button>
              </div>
            )}

            {/* ── Product grid area ──────────────────────────────────── */}

            {loading && <Skeleton />}

            {!loading && (
              <>
                {products.length === 0 ? (
                  <div className="flex flex-col items-center py-28 text-center">
                    <Icon name="search" size={44} className="text-gold-300/15 mb-4" />
                    <p className="text-[15px] text-ivory/45 font-medium">
                      {urlQ ? t("products.noResults").replace("{q}", urlQ) : t("products.noProducts")}
                    </p>
                    <p className="text-[12px] text-ivory/25 mt-1.5">
                      {urlQ ? t("products.trySearch") : cat !== "all" ? t("products.tryCategory") : t("products.checkBack")}
                    </p>
                    {(urlQ || cat !== "all" || shopId) && (
                      <button onClick={clearFilters}
                        className="mt-4 text-[12px] text-gold-300/70 hover:text-gold-300 transition underline"
                      >
                        {t("products.clearFilters")}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="relative">
                    {/* Refetch overlay */}
                    {fetching && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                        <div className="w-9 h-9 rounded-full border-2 border-gold-400/25 border-t-gold-400 animate-spin" />
                      </div>
                    )}

                    {/* Grid — one card per (product, shop) listing */}
                    <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 transition-opacity duration-200 ${fetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                      {products.map((p, i) => (
                        <Link
                          key={`${p.id}-${p.inventoryId}`}
                          href={`/product/${p.id}?shopId=${p.shopId}`}
                          className="group block lux-card card-cascade"
                          style={{ animationDelay: `${Math.min(i, 11) * 35}ms` }}
                        >
                          <div className="card-dark overflow-hidden h-full">
                            <div className="relative overflow-hidden">
                              <LuxImage
                                src={p.image}
                                alt={p.brand}
                                className="aspect-[4/5] group-hover:scale-108 transition-transform duration-700"
                                label={p.brand}
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                              <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              <SaleBadge onSale={p.onSale} price={p.retail} originalPrice={p.originalPrice} size="md" />

                              {/* Wishlist */}
                              {session && (
                                <button
                                  onClick={(e) => toggleLike(e, p.id)}
                                  className={`absolute top-3 right-3 w-8 h-8 rounded-full glass-dark flex items-center justify-center transition-all duration-200 active:scale-90 ${
                                    likedIds.has(p.id)
                                      ? "text-red-400 opacity-100"
                                      : "text-ivory/50 hover:text-red-400 opacity-0 group-hover:opacity-100"
                                  }`}
                                >
                                  <Icon
                                    name="heart"
                                    size={15}
                                    fill={likedIds.has(p.id) ? "currentColor" : "none"}
                                    strokeWidth={likedIds.has(p.id) ? 0 : 1.5}
                                  />
                                </button>
                              )}

                              {/* Buy directly + Add to Cart — both use inventoryId so the correct shop's stock is reserved */}
                              {session && (p.stock ?? 0) > 0 && (
                                <div className="absolute bottom-3 left-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                  <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); buyNow(p); }}
                                    className="h-9 rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 transition"
                                  >
                                    <Icon name="zap" size={14} /> {t("buy.buyNow")}
                                  </button>
                                  <button
                                    onClick={(e) => addToCart(e, p.inventoryId)}
                                    disabled={addingIds.has(p.inventoryId)}
                                    className="h-9 rounded-xl glass-dark gold-hairline text-gold-200 text-[12px] font-bold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 hover:text-gold-100 transition"
                                  >
                                    {addingIds.has(p.inventoryId)
                                      ? <><div className="w-3.5 h-3.5 border-2 border-gold-200/30 border-t-gold-200 rounded-full animate-spin" /> {t("products.adding")}</>
                                      : <><Icon name="bag" size={14} /> {t("product.addToCart")}</>
                                    }
                                  </button>
                                </div>
                              )}
                            </div>
                            <div className="p-4">
                              <div className="text-[10px] tracking-[0.2em] uppercase text-gold-300/65 mb-1.5">{p.brand}</div>
                              <p className="text-ivory/85 text-[13px] leading-snug line-clamp-2 min-h-[2.6em]">{p.title}</p>
                              <div className="mt-3">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-gold-200 text-[15px] font-semibold tracking-tight">{fmtNative(p.retail, currency.code)}</span>
                                  {p.onSale && p.originalPrice > p.retail && (
                                    <span className="text-ivory/30 text-[12px] line-through">{fmtNative(p.originalPrice, currency.code)}</span>
                                  )}
                                </div>
                                <div className="mt-1.5 inline-flex items-center gap-1.5 text-[10px] text-ivory/40 whitespace-nowrap">
                                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${(p.stock ?? 0) > 0 ? "bg-emerald-400" : "bg-red-400"}`} />
                                  {(p.stock ?? 0) > 0 ? t("common.inStock").replace("{n}", p.stock) : t("common.outOfStock")}
                                </div>
                              </div>
                              {/* Shop name — distinguishes same product from different sellers */}
                              {p.shopName && (
                                <div className="mt-2 flex items-center gap-1 text-[10px] text-ivory/35">
                                  <Icon name="store" size={10} className="shrink-0" />
                                  <span className="truncate">{p.shopName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>

                    {/* Pagination */}
                    <Pagination page={page} totalPages={totalPages} onChange={gotoPage} />

                    {totalPages > 1 && (
                      <p className="text-center text-[11px] text-ivory/25 pb-4">
                        {t("products.pageOf").replace("{page}", page).replace("{total}", totalPages).replace("{n}", total)}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="luxe min-h-screen" />}>
      <ProductsContent />
    </Suspense>
  );
}
