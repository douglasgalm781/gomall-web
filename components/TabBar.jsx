"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icon";

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const is = (p) => pathname === p;

  return (
    <div className="fixed bottom-0 inset-x-0 w-full lg:hidden z-30">
      <div className="relative glass-dark border-t border-gold-400/20 h-[70px] flex items-end justify-around px-8 pb-2.5">
        <Link
          href="/"
          className={`flex flex-col items-center gap-1 pb-1 ${is("/") ? "text-gold-300" : "text-ivory/45"}`}
        >
          <Icon name="home" size={22} strokeWidth={is("/") ? 2.4 : 2} />
          <span className="text-[11px] font-medium tracking-wide">{t("nav.home")}</span>
        </Link>

        <button onClick={() => router.push("/products")} className="flex flex-col items-center -mt-7">
          <span className="w-14 h-14 rounded-full flex items-center justify-center shadow-gold ring-1 ring-gold-200/70 bg-gradient-to-b from-gold-300 via-gold-400 to-gold-600 text-ink-900 active:scale-95 transition">
            <Icon name="bag" size={24} strokeWidth={2.4} />
          </span>
          <span className="text-[11px] font-medium text-ivory/45 mt-1 tracking-wide">{t("nav.products")}</span>
        </button>

        <Link
          href="/profile"
          className={`flex flex-col items-center gap-1 pb-1 ${is("/profile") ? "text-gold-300" : "text-ivory/45"}`}
        >
          <Icon name="user" size={22} strokeWidth={is("/profile") ? 2.4 : 2} />
          <span className="text-[11px] font-medium tracking-wide">{t("nav.mine")}</span>
        </Link>
      </div>
    </div>
  );
}
