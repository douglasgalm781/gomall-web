"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession, logout } from "@/lib/store";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import Icon from "@/components/Icon";
import { SIDEBAR, NAV_ITEMS, renderSectionBySlug } from "../_sections";

export default function ProfileSectionPage() {
  const { section } = useParams();
  const router  = useRouter();
  const session = useSession();
  const { t }   = useI18n();

  const account = session?.account ?? "";

  const [cartCount, setCartCount] = useState(0);
  const [shipCount, setShipCount] = useState(0);

  // Validate slug — redirect unknown slugs to /profile
  const validItem = NAV_ITEMS.find((s) => s.slug === section);
  useEffect(() => {
    if (!validItem) router.replace("/profile");
  }, [validItem, router]);

  useEffect(() => {
    if (!session) return;
    api.get("/cart").then((d) => setCartCount((d.items || []).length)).catch(() => {});
    api.get("/shipping").then((d) =>
      setShipCount((d.items || []).filter((o) => o.status !== "delivered" && o.status !== "cancelled").length)
    ).catch(() => {});
  }, [session]);

  const badges = { cart: cartCount, shipping: shipCount };

  if (!validItem) return null;

  return (
    <div className="luxe min-h-screen pb-28 lg:pb-0">
      <div className="lg:flex lg:min-h-[calc(100vh-64px)]">

        {/* ── Desktop Sidebar ───────────────────────────────────────────── */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[260px] lg:shrink-0 lg:border-r lg:border-gold-400/15 lg:min-h-[calc(100vh-64px)]">
          <div className="px-6 py-6 border-b border-gold-400/12">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center serif text-[20px] font-bold text-ink-900 shrink-0 overflow-hidden">
                {session?.avatar
                  ? <img src={session.avatar} alt="" className="w-full h-full object-cover" />
                  : (account.slice(0, 2).toUpperCase() || "GM")
                }
              </div>
              <div className="min-w-0">
                <p className="text-[12px] text-ivory/40">{t("profile.hi")}</p>
                <p className="text-[15px] font-bold text-ivory truncate">{session?.fullName || account}</p>
                {session?.fullName && <p className="text-[11px] text-ivory/40 truncate">{account}</p>}
              </div>
            </div>
          </div>

          <nav className="flex-1 py-2 overflow-y-auto">
            {SIDEBAR.map((item, i) => {
              if (item.type === "section") {
                return <p key={i} className="px-5 pt-5 pb-1 text-[9px] font-bold text-ivory/25 uppercase tracking-[0.22em]">{t(item.labelKey)}</p>;
              }
              const isActive = item.slug === section;
              const badge    = badges[item.key];
              const href     = item.slug ? `/profile/${item.slug}` : "/profile";
              return (
                <Link
                  key={item.key}
                  href={href}
                  className={`group relative flex items-center gap-3 px-5 py-2.5 text-[13px] transition ${
                    isActive ? "text-gold-300 bg-gold-400/10" : "text-ivory/60 hover:text-ivory hover:bg-white/5"
                  }`}
                >
                  <span className={`absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gold-400 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-40"}`} />
                  <Icon name={item.icon} size={16} className="shrink-0" />
                  <span className="flex-1">{t(item.labelKey)}</span>
                  {badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-gold-400 text-ink-900 text-[9px] font-bold flex items-center justify-center shrink-0">{badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gold-400/12 px-5 py-4">
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              className="w-full flex items-center gap-2 text-[13px] text-red-400/70 hover:text-red-400 transition py-1"
            >
              <Icon name="logout" size={15} />
              {t("profile.logout")}
            </button>
          </div>
        </aside>

        {/* ── Content Area ──────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Mobile header with back button */}
          <div className="lg:hidden sticky top-0 z-20 glass-dark border-b border-gold-400/15">
            <div className="px-4 h-14 flex items-center gap-3">
              <Link
                href="/profile"
                className="w-9 h-9 rounded-full bg-white/8 gold-hairline text-ivory/70 flex items-center justify-center shrink-0"
              >
                <Icon name="chevronLeft" size={18} />
              </Link>
              <p className="text-[14px] font-semibold text-ivory flex-1 truncate">
                {t(validItem.labelKey)}
              </p>
            </div>
          </div>

          {renderSectionBySlug(section, { session, onCountChange: setCartCount })}
        </div>
      </div>
    </div>
  );
}
