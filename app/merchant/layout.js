"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/lib/store";
import Icon from "@/components/Icon";
import { useI18n } from "@/lib/i18n";

export default function MerchantLayout({ children }) {
  const { t } = useI18n();
  const session  = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  const NAV = [
    { href: "/merchant",          icon: "barChart", label: t("merchant.nav.dashboard") },
    { href: "/merchant/products", icon: "package",  label: t("merchant.nav.products")  },
    { href: "/merchant/shop",     icon: "store",    label: t("merchant.nav.myShop")     },
    { href: "/merchant/shipping", icon: "truck",    label: t("merchant.nav.shipping")   },
  ];

  useEffect(() => {
    if (session === null) return; // still loading
    if (!session || !session.isMerchant) router.replace("/profile/my-shop");
    if (session?.shopStatus === "suspended") router.replace("/profile/my-shop");
  }, [session, router]);

  const isSuspended = session?.shopStatus === "suspended";
  if (!session?.isMerchant || isSuspended) return null;

  return (
    <div className="luxe min-h-screen pb-28 lg:pb-0">
      {/* Merchant mode banner */}
      <div className="bg-emerald-900/30 border-b border-emerald-400/20 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-300 text-[12px] font-semibold">
          <Icon name="store" size={14} />
          <span>{t("merchant.banner.mode").replace("{name}", session.shopData?.name || t("merchant.banner.defaultName"))}</span>
        </div>
        <Link href="/" className="text-[12px] text-emerald-300/60 hover:text-emerald-300 flex items-center gap-1 transition">
          <Icon name="arrowLeft" size={12} /> {t("merchant.banner.backToShopping")}
        </Link>
      </div>

      {/* Suspension notice */}
      {isSuspended && (
        <div className="bg-rose-900/25 border-b border-rose-400/20 px-4 py-3 flex items-start gap-3">
          <Icon name="alert" size={16} className="text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-rose-300">{t("merchant.banner.suspendedTitle")}</p>
            {session.shopRejectionNote && (
              <p className="text-[12px] text-rose-300/70 mt-0.5">{session.shopRejectionNote}</p>
            )}
            <p className="text-[12px] text-rose-300/60 mt-1">
              {t("merchant.banner.notePrefix")}
              <Link href="/merchant/shop" className="underline hover:text-rose-300 transition">{t("merchant.banner.shopSettingsLink")}</Link>
              {t("merchant.banner.noteSuffix")}
            </p>
          </div>
        </div>
      )}

      <div className="lg:flex lg:min-h-[calc(100vh-96px)]">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex lg:flex-col lg:w-[220px] lg:shrink-0 lg:border-r lg:border-gold-400/15 lg:min-h-full">
          <nav className="p-4 space-y-1">
            {NAV.map((item) => {
              const active = item.href === "/merchant"
                ? pathname === "/merchant"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition ${
                    active
                      ? "bg-gold-400/12 text-gold-300 gold-hairline"
                      : "text-ivory/60 hover:text-ivory hover:bg-white/5"
                  }`}
                >
                  <Icon name={item.icon} size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 lg:px-8 py-6 space-y-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0c0a07]/96 border-t border-gold-400/20 backdrop-blur-xl flex h-16" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV.map((item) => {
          const active = item.href === "/merchant"
            ? pathname === "/merchant"
            : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center justify-center gap-[3px] transition ${
                active ? "text-gold-300" : "text-ivory/50"
              }`}
            >
              <Icon name={item.icon} size={22} strokeWidth={active ? 2 : 1.5} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
