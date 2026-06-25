"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, logout } from "@/lib/store";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import Icon from "@/components/Icon";
import { SIDEBAR, OverviewSection } from "./_sections";

const MOBILE_QUICK = [
  { key: "cart",     slug: "cart",     icon: "bag",   color: "from-gold-400/20 to-gold-600/10"     },
  { key: "likes",    slug: "likes",    icon: "heart", color: "from-red-400/20 to-rose-600/10"      },
  { key: "shipping", slug: "shipping", icon: "truck", color: "from-sky-400/20 to-sky-600/10"       },
  { key: "invite",   slug: "invite",   icon: "users", color: "from-violet-400/20 to-violet-600/10" },
];

// Mobile menu mirrors the desktop sidebar (SIDEBAR) exactly — same groups,
// items, and order — so web and mobile stay in sync from a single source.
const MOBILE_MENU = SIDEBAR.reduce((groups, item) => {
  if (item.type === "section") groups.push({ labelKey: item.labelKey, items: [] });
  else if (groups.length) groups[groups.length - 1].items.push(item);
  return groups;
}, []);

export default function ProfilePage() {
  const session = useSession();
  const router  = useRouter();
  const { t }   = useI18n();
  const { fmt } = useCurrency();

  const account = session?.account ?? "";
  const balance = session?.balance ?? 0;

  const [cartCount, setCartCount] = useState(0);
  const [shipCount, setShipCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    api.get("/cart").then((d) => setCartCount((d.items || []).length)).catch(() => {});
    api.get("/shipping").then((d) =>
      setShipCount((d.items || []).filter((o) => o.status !== "delivered" && o.status !== "cancelled").length)
    ).catch(() => {});
  }, [session]);

  const badges = { cart: cartCount, shipping: shipCount };

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
              // "Profile" item has slug="" → root /profile — always active here
              const isActive = item.slug === "";
              const href     = item.slug ? `/profile/${item.slug}` : "/profile";
              const badge    = badges[item.key];
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

        {/* ── Desktop Content: Profile (Overview) Section ───────────────── */}
        <div className="hidden lg:block flex-1 min-w-0">
          <OverviewSection session={session} />
        </div>

        {/* ── Mobile Hub ────────────────────────────────────────────────── */}
        <div className="lg:hidden flex-1 min-w-0">
          {/* Hero */}
          <div className="hero-accent relative overflow-hidden px-5 pt-10 pb-14 rounded-b-[32px]">
            <div className="orb animate-orb w-44 h-44 bg-gold-400/22 -top-16 -right-12" />
            <div className="orb w-28 h-28 bg-gold-700/30 top-4 -left-10" />
            <div className="relative z-10 flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center serif text-[22px] font-bold text-ink-900 ring-2 ring-gold-300/40 shrink-0">
                {session?.avatar
                  ? <img src={session.avatar} alt="" className="w-full h-full object-cover" />
                  : (account.slice(0, 2).toUpperCase() || "GM")
                }
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="serif text-[19px] font-bold text-ivory leading-tight truncate">{session?.fullName || account}</div>
                {session?.fullName && <div className="text-[12px] text-ivory/45 truncate">{account}</div>}
              </div>
              <Link href="/notifications" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-ivory/60 shrink-0">
                <Icon name="bell" size={17} />
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="px-4 mt-4 grid grid-cols-2 gap-3">
            <div className="card-dark p-4">
              <div className="text-[9px] text-ivory/35 uppercase tracking-widest mb-1">{t("profile.myBalance")}</div>
              {Object.keys(session?.wallets || {}).length > 0 ? (
                <div className="space-y-0.5">
                  {Object.entries(session.wallets).slice(0, 2).map(([code, bal]) => (
                    <div key={code} className="flex items-baseline gap-1.5">
                      <span className="text-[14px] font-bold gold-text tracking-tight">{bal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      <span className="text-[9px] text-ivory/40">{code}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[18px] font-bold gold-text tracking-tight">{fmt(balance)}</div>
              )}
            </div>
          </div>

          {/* Quick tiles — link to /profile/[slug] sub-pages */}
          <div className="px-4 mt-4 grid grid-cols-4 gap-3">
            {MOBILE_QUICK.map(({ key, slug, icon, color }) => (
              <Link key={key} href={`/profile/${slug}`} className="relative flex flex-col items-center gap-2 card-dark p-3 rounded-2xl">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-ivory`}>
                  <Icon name={icon} size={19} />
                </div>
                <span className="text-[10px] text-ivory/65 text-center leading-tight">{t(`profile.menu.${key}`)}</span>
                {badges[key] > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gold-400 text-ink-900 text-[9px] font-bold flex items-center justify-center">
                    {badges[key]}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Menu — mirrors the desktop sidebar exactly */}
          <div className="px-4 mt-4 space-y-5">
            {MOBILE_MENU.map((group) => (
              <div key={group.labelKey}>
                <p className="px-1 mb-2 text-[11px] font-semibold text-ivory/35 uppercase tracking-[0.18em]">{t(group.labelKey)}</p>
                <div className="card-dark overflow-hidden divide-y divide-gold-400/10">
                  {group.items.map((item) => {
                    // "overview" lives at /profile root on desktop (the hub on mobile),
                    // so it gets the dedicated mobile edit route.
                    const href  = item.slug ? `/profile/${item.slug}` : "/profile/account";
                    const badge = badges[item.key];
                    return (
                      <Link key={item.key} href={href} className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition">
                        <span className="w-9 h-9 rounded-xl gold-hairline bg-gold-400/10 text-gold-300 flex items-center justify-center shrink-0">
                          <Icon name={item.icon} size={17} />
                        </span>
                        <span className="flex-1 text-[14px] text-ivory/85">{t(item.labelKey)}</span>
                        {badge > 0 && (
                          <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-gold-400 text-ink-900 text-[10px] font-bold flex items-center justify-center shrink-0">{badge}</span>
                        )}
                        <Icon name="chevronRight" size={16} className="text-gold-300/25 shrink-0" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Logout */}
          <div className="px-4 mt-4">
            <button
              onClick={() => { logout(); router.replace("/login"); }}
              className="w-full card-dark px-4 py-3.5 flex items-center justify-center gap-2 text-[14px] font-semibold text-red-400/80 transition rounded-2xl"
            >
              <Icon name="logout" size={17} />{t("profile.logout")}
            </button>
          </div>

          <div className="h-6" />
        </div>
      </div>
    </div>
  );
}
