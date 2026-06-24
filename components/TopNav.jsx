"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useSession, logout } from "@/lib/store";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

const LANGS = [
  { code: "en", label: "EN", full: "English"    },
  { code: "zh", label: "中",  full: "中文简体"   },
  { code: "es", label: "ES", full: "Español"    },
  { code: "vi", label: "VI", full: "Tiếng Việt" },
];
import Icon from "./Icon";
import Logo from "./Logo";

const NAV_LINKS = [
  { href: "/",        labelKey: "nav.home"              },
  { href: "/products",labelKey: "nav.products"          },
  { href: "/likes",   labelKey: "profile.menu.likes"    },
  { href: "/shipping",labelKey: "profile.menu.shipping" },
];

export default function TopNav() {
  const session  = useSession();
  const router   = useRouter();
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();
  const { fmt, currency, setCurrency, currencies } = useCurrency();

  const [cartCount,    setCartCount]    = useState(0);
  const [notifCount,   setNotifCount]   = useState(0);
  const [query,        setQuery]        = useState("");
  const [showCurrency, setShowCurrency] = useState(false);
  const [showLang,     setShowLang]     = useState(false);
  const [showWallet,   setShowWallet]   = useState(false);
  const [showProfile,  setShowProfile]  = useState(false);
  const currRef    = useRef(null);
  const langRef    = useRef(null);
  const walletRef  = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (!session) { setCartCount(0); setNotifCount(0); return; }
    api.get("/cart").then((d) => setCartCount((d.items || []).length)).catch(() => {});
    api.get("/notifications").then((d) => setNotifCount(d.unread || 0)).catch(() => {});
  }, [session]);

  // Sync search box with the URL's ?q= when navigating between pages
  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("q") || "";
    setQuery(q);
  }, [pathname]);

  useEffect(() => {
    function onCartUpdated(e) {
      const count = e.detail?.count;
      if (typeof count === "number") setCartCount(count);
      else api.get("/cart").then((d) => setCartCount((d.items || []).length)).catch(() => {});
    }
    function onNotifUpdated(e) {
      const count = e.detail?.count;
      if (typeof count === "number") setNotifCount(count);
      else api.get("/notifications").then((d) => setNotifCount(d.unread || 0)).catch(() => {});
    }
    window.addEventListener("cartUpdated", onCartUpdated);
    window.addEventListener("notifUpdated", onNotifUpdated);
    return () => {
      window.removeEventListener("cartUpdated", onCartUpdated);
      window.removeEventListener("notifUpdated", onNotifUpdated);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handler(e) {
      if (currRef.current    && !currRef.current.contains(e.target))    setShowCurrency(false);
      if (langRef.current    && !langRef.current.contains(e.target))    setShowLang(false);
      if (walletRef.current  && !walletRef.current.contains(e.target))  setShowWallet(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function handleSearch(e) {
    e.preventDefault();
    if (pathname?.startsWith("/products")) {
      const params = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      if (query.trim()) params.set("q", query.trim()); else params.delete("q");
      params.delete("page");
      router.push(`/products?${params.toString()}`);
    } else if (pathname?.startsWith("/search")) {
      if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      else router.push("/search");
    } else {
      if (!query.trim()) return;
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className="hidden lg:block fixed top-0 inset-x-0 z-40 bg-[#0c0a07]/95 backdrop-blur-xl border-b border-gold-400/20">
      <div className="max-w-[1600px] mx-auto flex items-center gap-6 h-16 px-8">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Logo size={28} />
          <span className="serif text-[18px] font-bold text-ivory tracking-wide">
            Go<span className="gold-text">Mall</span>
          </span>
        </Link>

        {/* Primary nav */}
        <nav className="flex items-center gap-1 shrink-0">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition ${
                  active ? "text-gold-300 bg-gold-400/10" : "text-ivory/65 hover:text-ivory hover:bg-white/5"
                }`}
              >
                {t(l.labelKey)}
              </Link>
            );
          })}
        </nav>

        {/* ── Search bar (center) ──────────────────────────────── */}
        <form onSubmit={handleSearch} className={`flex-1 max-w-[440px] ${pathname?.startsWith("/profile") ? "invisible pointer-events-none" : ""}`}>
          <div className="relative flex items-center">
            <Icon
              name="search"
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ivory/35 pointer-events-none"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="w-full h-9 bg-[#1c1610] border border-gold-400/20 rounded-full pl-9 pr-20 text-[13px] text-ivory placeholder-ivory/40 outline-none focus:border-gold-400/50 transition"
            />
            <button
              type="submit"
              className="absolute right-1 h-7 px-3 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[11px] font-bold transition hover:opacity-90"
            >
              {t("search.title")}
            </button>
          </div>
        </form>

        {/* ── Right-side actions ───────────────────────────────── */}
        <div className="flex items-center gap-2 ml-auto shrink-0">

          {/* Language picker */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => { setShowLang((v) => !v); setShowCurrency(false); }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full gold-hairline bg-white/5 text-[12px] font-semibold text-ivory/70 hover:text-gold-300 transition"
            >
              <Icon name="globe" size={14} />
              <span className="text-[13px]">{LANGS.find((l) => l.code === lang)?.label ?? "EN"}</span>
              <Icon name="chevronDown" size={12} />
            </button>
            {showLang && (
              <div className="absolute right-0 top-11 bg-[#1a1510] border border-gold-400/30 rounded-2xl py-1.5 min-w-[150px] z-50 shadow-lux overflow-hidden">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { setLang(l.code); setShowLang(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition ${
                      lang === l.code
                        ? "text-gold-300 bg-gold-400/15 font-semibold"
                        : "text-ivory/80 hover:bg-white/8 hover:text-ivory"
                    }`}
                  >
                    <span>{l.full}</span>
                    {lang === l.code && <Icon name="check" size={13} className="text-gold-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Currency picker */}
          <div className="relative" ref={currRef}>
            <button
              onClick={() => { setShowCurrency((v) => !v); setShowLang(false); }}
              className="flex items-center gap-1.5 h-9 px-3 rounded-full gold-hairline bg-white/5 text-[12px] font-semibold text-ivory/70 hover:text-gold-300 transition"
            >
              <Icon name="coins" size={14} />
              {currency.label || currency.code}
              <Icon name="chevronDown" size={12} />
            </button>
            {showCurrency && (
              <div className="absolute right-0 top-11 bg-[#1a1510] border border-gold-400/30 rounded-2xl py-1.5 min-w-[150px] z-50 shadow-lux overflow-hidden">
                {currencies.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => { setCurrency(c); setShowCurrency(false); }}
                    className={`w-full flex items-center justify-between px-4 py-2.5 text-[13px] transition ${
                      currency.code === c.code
                        ? "text-gold-300 bg-gold-400/15 font-semibold"
                        : "text-ivory/80 hover:bg-white/8 hover:text-ivory"
                    }`}
                  >
                    <span>{c.code.startsWith("USDT") ? (c.label || c.code) : `${c.symbol} ${c.label || c.code}`}</span>
                    {currency.code === c.code && <Icon name="check" size={13} className="text-gold-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Multi-wallet balance */}
          {session && (
            <div ref={walletRef} className="relative">
              <button
                onClick={() => { setShowWallet((v) => !v); setShowCurrency(false); setShowLang(false); }}
                className="flex items-center gap-1.5 h-9 px-3 rounded-full gold-hairline bg-white/5 hover:bg-gold-400/10 transition"
              >
                <Icon name="coins" size={13} className="text-gold-300/70" />
                <span className="text-[13px] font-semibold gold-text tracking-tight">
                  {fmt(
                    Object.entries(session.wallets || {}).reduce((sum, [code, bal]) => {
                      const rate = currencies.find((c) => c.code === code)?.rate ?? 1;
                      return sum + bal / rate;
                    }, 0)
                  )}
                </span>
                <Icon name="chevronDown" size={11} className="text-ivory/40" />
              </button>
              {showWallet && (
                <div className="absolute right-0 top-11 bg-[#1a1510] border border-gold-400/30 rounded-2xl py-2 min-w-[200px] z-50 shadow-lux">
                  <p className="text-[10px] font-semibold text-ivory/35 uppercase tracking-widest px-4 pb-1.5">{t("profile.currency")}</p>
                  {Object.keys(session.wallets || {}).length === 0 && (
                    <p className="px-4 py-2 text-[13px] text-ivory/40">0.00 USD</p>
                  )}
                  {Object.entries(session.wallets || {}).map(([code, bal]) => (
                    <div key={code} className="flex items-center justify-between px-4 py-2">
                      <span className="text-[12px] font-semibold text-ivory/60">{code}</span>
                      <span className="text-[13px] font-bold gold-text">
                        {bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                  <div className="mx-3 mt-1 pt-2 border-t border-white/8">
                    <Link
                      href="/recharge"
                      onClick={() => setShowWallet(false)}
                      className="flex items-center justify-center gap-1.5 h-8 rounded-xl bg-gold-400/12 text-gold-300 text-[12px] font-semibold hover:bg-gold-400/20 transition"
                    >
                      <Icon name="plus" size={12} /> {t("recharge.title")}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cart */}
          {session && (
            <Link
              href="/cart"
              className="relative w-9 h-9 rounded-full gold-hairline bg-white/5 text-gold-300 flex items-center justify-center hover:bg-gold-400/15 transition"
            >
              <Icon name="bag" size={17} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-400 text-ink-900 text-[9px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative w-9 h-9 rounded-full gold-hairline bg-white/5 text-gold-300 flex items-center justify-center hover:bg-gold-400/15 transition"
          >
            <Icon name="bell" size={17} />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gold-400 text-ink-900 text-[9px] font-bold flex items-center justify-center">
                {notifCount > 99 ? "99+" : notifCount}
              </span>
            )}
          </Link>

          {/* Merchant switch button */}
          {session?.isMerchant && (
            <Link
              href="/merchant"
              className="flex items-center gap-1.5 h-9 px-3 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[12px] font-semibold hover:bg-emerald-500/25 transition shrink-0"
            >
              <Icon name="store" size={14} />
              <span className="hidden xl:inline">My Store</span>
            </Link>
          )}

          {/* User avatar / auth buttons */}
          {session ? (
            <div className="relative" ref={profileRef}>
              {/* Avatar trigger */}
              <button
                onClick={() => {
                  setShowProfile((v) => !v);
                  setShowCurrency(false);
                  setShowLang(false);
                  setShowWallet(false);
                }}
                className="flex items-center gap-2 pl-1 group"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center serif text-[12px] font-bold text-ink-900 ring-1 ring-gold-400/30 group-hover:ring-gold-400/60 transition overflow-hidden">
                  {session.avatar
                    ? <img src={session.avatar} alt="" className="w-full h-full object-cover" />
                    : (session.account || "").slice(0, 2).toUpperCase()
                  }
                </div>
                <Icon name="chevronDown" size={13} className={`text-ivory/40 transition-transform duration-200 ${showProfile ? "rotate-180" : ""}`} />
              </button>

              {/* Profile dropdown */}
              {showProfile && (
                <div className="absolute right-0 top-[calc(100%+10px)] w-56 bg-[#1a1510] border border-gold-400/25 rounded-2xl shadow-lux overflow-hidden z-50">

                  {/* User info header */}
                  <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center serif text-[13px] font-bold text-ink-900 shrink-0 overflow-hidden">
                      {session.avatar
                        ? <img src={session.avatar} alt="" className="w-full h-full object-cover" />
                        : (session.account || "").slice(0, 2).toUpperCase()
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-ivory truncate">{session.fullName || session.account}</p>
                      {session.fullName && <p className="text-[11px] text-ivory/40 truncate">{session.account}</p>}
                      {session.vip > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-gold-300 bg-gold-400/12 px-1.5 py-0.5 rounded-full mt-0.5">
                          <Icon name="crown" size={10} /> VIP {session.vip}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="py-1.5">
                    {[
                      { label: t("nav.settings"), icon: "settings", href: "/profile" },
                      { label: t("nav.about"),   icon: "info",     href: "/about"   },
                      { label: t("nav.terms"),   icon: "fileText", href: "/terms"   },
                      { label: t("nav.privacy"), icon: "shield",   href: "/privacy" },
                    ].map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowProfile(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-[13px] text-ivory/80 hover:text-ivory hover:bg-white/6 transition"
                      >
                        <Icon name={item.icon} size={15} className="text-ivory/40 shrink-0" />
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </div>

                  {/* Logout */}
                  <div className="border-t border-white/8 py-1.5">
                    <button
                      onClick={() => { setShowProfile(false); logout(); router.push("/login"); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] text-red-400 hover:text-red-300 hover:bg-red-500/8 transition"
                    >
                      <Icon name="logout" size={15} className="shrink-0" />
                      <span>{t("profile.logout") || "Log out"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login"    className="btn-ghost h-9 px-4 flex items-center text-[13px]">{t("login.submit")}</Link>
              <Link href="/register" className="btn-primary h-9 px-4 flex items-center text-[13px]">{t("register.submit")}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
