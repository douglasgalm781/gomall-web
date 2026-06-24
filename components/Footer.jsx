"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { LANGUAGES } from "@/lib/data";
import { api } from "@/lib/api";
import Icon from "./Icon";
import Logo from "./Logo";

const NO_FOOTER_PATHS = ["/service/chat", "/shipping/"];

export default function Footer() {
  const pathname = usePathname();
  const { t, lang, setLang } = useI18n();

  // All hooks must be before any early return
  const [email,      setEmail]      = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [subError,   setSubError]   = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);
  const langRef = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (langRef.current && !langRef.current.contains(e.target)) setLangOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (NO_FOOTER_PATHS.some((p) => pathname?.startsWith(p))) return null;

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const QUICK_LINKS = [
    { label: t("nav.home"),              href: "/"         },
    { label: t("profile.menu.cart"),     href: "/cart"     },
    { label: t("profile.menu.shipping"), href: "/shipping" },
    { label: t("profile.menu.invite"),   href: "/invite"   },
  ];

  const SUPPORT_LINKS = [
    { label: t("info.terms.title"),      href: "/terms"   },
    { label: t("info.privacy.title"),    href: "/privacy" },
    { label: t("info.about.title"),      href: "/about"   },
  ];

  const year = new Date().getFullYear();
  const copyright = t("footer.copyright").replace("{year}", year);

  async function subscribe(e) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || submitting) return;
    setSubError("");
    setSubmitting(true);
    try {
      await api.post("/newsletter", { email: addr });
      setSubscribed(true);
      setEmail("");
    } catch (err) {
      setSubError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="bg-[#0c0a07] border-t border-gold-400/15">

      {/* ── Main grid ──────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 pt-12 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Logo size={28} />
              <span className="serif text-[18px] font-bold tracking-wide gold-text">GoMall</span>
            </Link>
            <p className="text-[13px] text-ivory/45 leading-relaxed max-w-[220px]">
              {t("footer.tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[11px] font-semibold text-ivory/40 uppercase tracking-[0.22em] mb-4">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-[13px] text-ivory/55 hover:text-gold-300 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-[11px] font-semibold text-ivory/40 uppercase tracking-[0.22em] mb-4">{t("footer.support")}</h4>
            <ul className="space-y-2.5">
              {SUPPORT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-ivory/55 hover:text-gold-300 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[11px] font-semibold text-ivory/40 uppercase tracking-[0.22em] mb-4">{t("footer.contact")}</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <Icon name="mail" size={14} className="text-gold-300/60 mt-0.5 shrink-0" />
                <a href="mailto:support@gomall.com" className="text-[13px] text-ivory/55 leading-snug hover:text-gold-300 transition-colors">
                  support@gomall.com
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="globe" size={14} className="text-gold-300/60 mt-0.5 shrink-0" />
                <span className="text-[13px] text-ivory/55 leading-snug">www.gomall.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Icon name="clock" size={14} className="text-gold-300/60 mt-0.5 shrink-0" />
                <span className="text-[13px] text-ivory/55 leading-snug">{t("footer.contactHours")}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Newsletter row ─────────────────────────────────────────── */}
      <div className="border-t border-white/6">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 py-8 flex flex-col items-center text-center gap-4">
          <p className="text-[14px] font-semibold text-ivory">{t("footer.newsletter")}</p>
          {subscribed ? (
            <div className="flex items-center gap-2 text-emerald-400 text-[13px]">
              <Icon name="check" size={16} /> {t("footer.subscribeSuccess")}
            </div>
          ) : (
            <>
              <form onSubmit={subscribe} className="flex gap-2 w-full max-w-sm">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setSubError(""); }}
                  placeholder={t("footer.emailPlaceholder")}
                  className="flex-1 h-11 bg-[#1c1610] border border-gold-400/25 rounded-xl px-4 text-[13px] text-ivory placeholder-ivory/40 outline-none focus:border-gold-400/55 transition"
                />
                <button type="submit" disabled={submitting}
                  className="h-11 px-5 rounded-xl bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[13px] font-semibold flex items-center gap-1.5 shrink-0 hover:opacity-90 transition disabled:opacity-60">
                  {submitting ? "..." : <>{t("footer.subscribe")} <Icon name="chevronRight" size={14} /></>}
                </button>
              </form>
              {subError && <p className="text-[12px] text-red-400">{subError}</p>}
            </>
          )}
        </div>
      </div>

      {/* ── Bottom strip ──────────────────────────────────────────── */}
      <div className="bg-black/40 border-t border-white/6">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">

          <p className="text-[11px] text-ivory/30 order-last sm:order-first">
            {copyright}
          </p>

          <div ref={langRef} className="relative">
            <button onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 h-7 px-3 rounded-full border border-white/15 bg-white/5 text-[11px] text-ivory/55 hover:text-ivory/80 transition">
              <Icon name="globe" size={12} />
              {currentLang.label}
              <Icon name="chevronDown" size={11} />
            </button>
            {langOpen && (
              <div className="absolute bottom-9 right-0 bg-[#1a1510] border border-gold-400/25 rounded-xl py-1.5 min-w-[160px] z-50 shadow-lux max-h-56 overflow-y-auto">
                {LANGUAGES.map((l) => (
                  <button key={l.code} onClick={() => { setLang(l.code); setLangOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-[12px] transition ${
                      lang === l.code ? "text-gold-300 bg-gold-400/12 font-semibold" : "text-ivory/70 hover:bg-white/6 hover:text-ivory"
                    }`}>
                    <span>{l.label}</span>
                    {lang === l.code && <Icon name="check" size={12} className="text-gold-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
