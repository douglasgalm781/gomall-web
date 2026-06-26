"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icon";

// Floating "Open a Shop" (免费开店) call-to-action. Mounted once globally; shows
// on every page EXCEPT merchant / auth pages, and hidden for users who already
// have a shop (they use the header "My Store" button instead). Anchored to the
// right edge, vertically centered.
const HIDE_PREFIXES = ["/merchant", "/login", "/register"];

export default function OpenShopButton() {
  const pathname = usePathname();
  const session = useSession();
  const { t } = useI18n();

  if (session?.isMerchant) return null;
  if (HIDE_PREFIXES.some((p) => pathname === p || pathname?.startsWith(p + "/"))) return null;

  return (
    <Link
      href="/profile/my-shop"
      aria-label={t("nav.openShop")}
      className="fixed z-40 right-0 top-1/3 -translate-y-1/2 hover:scale-110 transition-transform duration-300"
    >
      <span className="shop-cta relative flex items-center gap-2 h-12 pl-4 pr-4 rounded-l-full overflow-hidden bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 font-bold text-[13px] ring-1 ring-gold-200/50">
        {/* periodic shine sweep */}
        <span className="shop-cta-shine" />
        <Icon name="store" size={18} className="shop-cta-icon relative z-[1]" />
        <span className="relative z-[1] whitespace-nowrap">{t("nav.openShop")}</span>
      </span>
    </Link>
  );
}
