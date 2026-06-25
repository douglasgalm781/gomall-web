"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/store";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icon";

// /merchant has its own bottom nav (Dashboard/Products/My Shop/Shipping), so the
// global member bottom bar is suppressed there to avoid two overlapping nav bars.
const NO_BOTTOMBAR_PATHS = ["/service/chat", "/shipping/", "/merchant"];

export default function BottomBar() {
  const { t } = useI18n();
  const pathname  = usePathname();
  const session   = useSession();

  const TABS = [
    { href: "/",         icon: "home",   label: t("nav.home"),    match: (p) => p === "/"           },
    { href: "/products", icon: "store",  label: t("nav.shop"),    match: (p) => p.startsWith("/products") || p.startsWith("/product") },
    { href: "/search",   icon: "search", label: t("search.title"), match: (p) => p.startsWith("/search")   },
    { href: "/cart",     icon: "bag",    label: t("nav.cart"),    match: (p) => p.startsWith("/cart")      },
    { href: "/profile",  icon: "user",   label: t("nav.profile"), match: (p) => p.startsWith("/profile")   },
  ];
  const [cartCount, setCartCount] = useState(0);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    if (!session) { setCartCount(0); setNotifCount(0); return; }
    api.get("/cart").then((d) => setCartCount((d.items || []).length)).catch(() => {});
    api.get("/notifications").then((d) => setNotifCount(d.unread || 0)).catch(() => {});
  }, [session, pathname]); // re-check on navigation too

  useEffect(() => {
    function onNotifUpdated(e) {
      const count = e.detail?.count;
      if (typeof count === "number") setNotifCount(count);
      else api.get("/notifications").then((d) => setNotifCount(d.unread || 0)).catch(() => {});
    }
    window.addEventListener("notifUpdated", onNotifUpdated);
    return () => window.removeEventListener("notifUpdated", onNotifUpdated);
  }, []);

  if (NO_BOTTOMBAR_PATHS.some((p) => pathname?.startsWith(p))) return null;

  // The last tab is always Profile (merchants reach their store via Profile → My Shop).
  const tabs = TABS;

  return (
    <div
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-phone md:max-w-[768px] z-40 lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)", backgroundColor: "rgba(12, 10, 7, 0.96)" }}
    >
      {/* Frosted glass bar */}
      <div
        className="backdrop-blur-xl border-t border-gold-400/25 h-16 flex items-center shadow-[0_-10px_28px_-14px_rgba(0,0,0,0.75)]"
        style={{ backgroundColor: "rgba(12, 10, 7, 0.94)" }}
      >
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const isCart = tab.href === "/cart";
          const isProfile = tab.href === "/profile";
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-[3px] py-2 transition-all"
            >
              <div className="relative">
                <Icon
                  name={tab.icon}
                  size={22}
                  strokeWidth={active ? 2 : 1.5}
                  className={active ? "text-gold-300" : "text-ivory/60"}
                />
                {isCart && cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 rounded-full bg-gold-400 text-ink-900 text-[9px] font-bold flex items-center justify-center px-1">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
                {isProfile && notifCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-[#0c0a07]" />
                )}
              </div>
              <span
                className={`text-[10px] font-medium leading-none transition-colors ${
                  active ? "text-gold-300" : "text-ivory/55"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
