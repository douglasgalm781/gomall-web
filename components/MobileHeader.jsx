"use client";
import Link from "next/link";
import { useSession } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import Logo from "./Logo";
import Icon from "./Icon";

// Compact sticky brand header for mobile, so a header is always visible on
// pages that don't have their own (mirrors the home page header). Hidden on lg+
// where the full TopNav is shown instead.
export default function MobileHeader() {
  const session = useSession();
  const { t } = useI18n();

  return (
    <div className="sticky top-0 z-30 glass-dark px-4 md:px-8 h-16 flex items-center justify-between border-b border-gold-400/15 lg:hidden">
      <Link href="/" className="flex items-center gap-2">
        <Logo size={30} />
        <span className="serif text-[20px] font-bold text-ivory tracking-wide">
          Go<span className="gold-text">Mall</span>
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Link href="/search" className="w-9 h-9 rounded-full gold-hairline bg-white/5 text-gold-300 flex items-center justify-center">
          <Icon name="search" size={18} />
        </Link>
        {session ? (
          <>
            <Link href="/cart" className="w-9 h-9 rounded-full gold-hairline bg-white/5 text-gold-300 flex items-center justify-center">
              <Icon name="bag" size={18} />
            </Link>
            <Link href="/profile" className="w-9 h-9 rounded-full bg-gradient-to-br from-gold-300 to-gold-600 flex items-center justify-center serif text-[12px] font-bold text-ink-900 ring-1 ring-gold-400/30">
              {(session.account || "").slice(0, 2).toUpperCase()}
            </Link>
          </>
        ) : (
          <>
            <Link href="/login" className="h-8 px-3 rounded-full gold-hairline bg-white/5 text-ivory/80 text-[12px] font-semibold flex items-center">
              {t("login.submit")}
            </Link>
            <Link href="/register" className="h-8 px-3 rounded-full bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 text-[12px] font-bold flex items-center">
              {t("register.submit")}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
