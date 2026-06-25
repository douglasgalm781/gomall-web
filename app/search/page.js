"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categoryLabel } from "@/lib/data";
import { api, normalizeProduct } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency, fmtNative } from "@/lib/currency";
import { useSession } from "@/lib/store";
import { useTapReveal } from "@/lib/useTapReveal";
import { useBuyNow } from "@/components/BuyNowProvider";
import { useToast } from "@/components/Toast";
import Icon from "@/components/Icon";
import LuxImage from "@/components/LuxImage";
import Pagination from "@/components/Pagination";
import SaleBadge from "@/components/SaleBadge";

const PAGE_SIZE = 24;

function SearchContent() {
  const { t, lang } = useI18n();
  const { currency } = useCurrency();
  const searchParams = useSearchParams();
  const inputRef = useRef(null);
  const session  = useSession();
  const { onCardClick, actionCls } = useTapReveal();
  const buyNow   = useBuyNow();
  const toast    = useToast();

  const initialQ = searchParams.get("q") || "";
  const [query,          setQuery]          = useState(initialQ);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQ);
  const [cat,            setCat]            = useState("all");
  const [catKeys,        setCatKeys]        = useState(["all"]);
  const [products,       setProducts]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [fetching,       setFetching]       = useState(false);
  const [page,           setPage]           = useState(1);
  const [total,          setTotal]          = useState(0);
  const [addingIds,      setAddingIds]      = useState(new Set());
  const [likedIds,       setLikedIds]       = useState(new Set());

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
      toast.success(liked ? t("likes.added") : t("likes.removed"));
    } catch {
      toast.error(t("common.loadFailed"));
    }
  }

  async function addToCart(e, inventoryId) {
    e.preventDefault();
    e.stopPropagation();
    if (addingIds.has(inventoryId)) return;
    setAddingIds((s) => new Set(s).add(inventoryId));
    try {
      const res = await api.post("/cart", { inventoryId, qty: 1 });
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: { count: res.count ?? null } }));
      toast.success(t("cart.addedMsg"));
    } catch {
      toast.error(t("common.loadFailed"));
    } finally {
      setAddingIds((s) => { const n = new Set(s); n.delete(inventoryId); return n; });
    }
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
    setDebouncedQuery(q);
    inputRef.current?.focus();
  }, [searchParams]);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 350);
    return () => clearTimeout(timer);
  }, [query]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, cat, currency.code]);

  useEffect(() => {
    api.get("/config/categories").then((d) => {
      setCatKeys(["all", ...(d.items || [])]);
    }).catch(() => {});
  }, []);

  // Fetch
  useEffect(() => {
    const firstLoad = products.length === 0;
    if (firstLoad) setLoading(true);
    else setFetching(true);

    const params = new URLSearchParams({ currency: currency.code, page, pageSize: PAGE_SIZE });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (cat !== "all") params.set("category", cat);
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
  }, [page, debouncedQuery, cat, currency.code]);

  return (
    <div className="luxe min-h-screen pb-10">

      {/* ── Sticky search header ─────────────────────────────────── */}
      <div className="sticky top-0 z-20 glass-dark border-b border-gold-400/15">
        <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pt-4 pb-3 space-y-3">

          {/* Input — mobile only; desktop uses the header search bar */}
          <div className="relative lg:hidden">
            <Icon name="search" size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gold-300/50 pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full h-11 bg-white/5 gold-hairline rounded-2xl text-[14px] text-ivory placeholder-ivory/30 pl-11 pr-10 outline-none focus:border-gold-400/50 transition"
            />
            {query ? (
              <button
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ivory/35 hover:text-ivory/70 transition"
              >
                <Icon name="close" size={16} />
              </button>
            ) : (
              <Link href="/" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ivory/35 hover:text-gold-300 transition text-[12px] font-medium">
                Cancel
              </Link>
            )}
          </div>

          {/* Category chips */}
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
            {catKeys.map((key) => (
              <button key={key} onClick={() => setCat(key)}
                className={`shrink-0 h-7 px-3.5 rounded-full text-[11px] font-medium transition ${
                  cat === key
                    ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900"
                    : "gold-hairline bg-white/5 text-ivory/65"
                }`}
              >
                {categoryLabel(t, key)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 md:px-8 lg:px-12 pt-5">

        {/* Initial skeleton */}
        {loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {[...Array(PAGE_SIZE)].map((_, i) => (
              <div key={i} className="card-dark overflow-hidden animate-pulse">
                <div className="aspect-[4/5] bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-2 bg-white/5 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded" />
                  <div className="h-3 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-1/3 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && (
          <>
            {products.length > 0 && (
              <p className="text-[12px] text-ivory/35 mb-4">
                {total} item{total !== 1 ? "s" : ""}
                {debouncedQuery && <> matching <span className="text-ivory/60 font-medium">"{debouncedQuery}"</span></>}
              </p>
            )}

            {products.length > 0 ? (
              <div className="relative">
                {/* Refetch overlay */}
                {fetching && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                    <div className="w-9 h-9 rounded-full border-2 border-gold-400/25 border-t-gold-400 animate-spin" />
                  </div>
                )}

                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4 transition-opacity duration-200 ${fetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}>
                  {products.map((p, i) => (
                    <Link
                      key={`${p.id}-${p.inventoryId}`}
                      href={`/product/${p.id}?shopId=${p.shopId}`}
                      onClick={onCardClick(`${p.id}-${p.inventoryId}`, !!session && (p.stock ?? 0) > 0)}
                      className="group block card-enter"
                      style={{ animationDelay: `${Math.min(i, 11) * 30}ms` }}
                    >
                      <div className="card-dark overflow-hidden">
                        <div className="relative overflow-hidden">
                          <LuxImage
                            src={p.image}
                            alt={p.brand}
                            className="aspect-[4/5] group-hover:scale-108 transition-transform duration-700"
                            label={p.brand}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none" />
                          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-gold-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          <SaleBadge onSale={p.onSale} price={p.retail} originalPrice={p.originalPrice} size="sm" />

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

                          {session && (p.stock ?? 0) > 0 && (
                            <div className={`absolute bottom-3 left-3 right-3 flex flex-col gap-2 ${actionCls(`${p.id}-${p.inventoryId}`)}`}>
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
                        <div className="p-3">
                          <div className="text-gold-300/70 text-[10px] tracking-[0.18em] uppercase truncate">{p.brand}</div>
                          <p className="text-ivory/85 text-[12px] leading-snug line-clamp-2 mt-0.5 min-h-[2.4em]">{p.title}</p>
                          <div className="flex items-center gap-1.5 flex-wrap mt-2">
                            <span className="text-gold-200 text-[14px] font-semibold tracking-tight">{fmtNative(p.retail, currency.code)}</span>
                            {p.onSale && p.originalPrice > p.retail && (
                              <span className="text-ivory/30 text-[11px] line-through">{fmtNative(p.originalPrice, currency.code)}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                <Pagination page={page} totalPages={totalPages} onChange={setPage} />

                {totalPages > 1 && (
                  <p className="text-center text-[11px] text-ivory/25 pb-4">
                    Page {page} of {totalPages} · {total} items
                  </p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center py-24 text-center">
                <Icon name="search" size={44} className="text-gold-300/20 mb-4" />
                <p className="text-[15px] font-semibold text-ivory/50">
                  {debouncedQuery ? `No results for "${debouncedQuery}"` : t("search.empty")}
                </p>
                <p className="text-[12px] text-ivory/30 mt-2 leading-relaxed max-w-xs">{t("search.emptyHint")}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchContent />
    </Suspense>
  );
}
