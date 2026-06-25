"use client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icon";

// Shared page header: a circular back button + left-aligned title (optionally a
// subtitle), with an optional right-side action. Kept consistent across all
// member pages (Favorites, Notifications, Cart, Shipments, …).
export default function BackHeader({ title, subtitle, right, dark }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div
      className={`sticky top-0 z-20 h-14 flex items-center gap-3 px-4 md:px-8 lg:px-12 ${
        dark ? "glass-dark border-b border-gold-400/15" : "glass border-b border-gold-400/20"
      }`}
    >
      <button
        onClick={() => router.back()}
        aria-label={t("common.back")}
        className={`w-9 h-9 shrink-0 rounded-full gold-hairline flex items-center justify-center transition ${
          dark ? "bg-white/5 text-ivory hover:bg-white/10" : "bg-white text-gold-600 hover:bg-gold-50"
        }`}
      >
        <Icon name="chevronLeft" size={20} />
      </button>
      <div className="min-w-0">
        <h1 className={`serif text-[17px] font-semibold tracking-wide leading-none truncate ${dark ? "text-ivory" : "text-ink-900"}`}>
          {title}
        </h1>
        {subtitle && (
          <p className={`text-[11px] mt-0.5 ${dark ? "text-gold-300/70" : "text-gold-600/70"}`}>{subtitle}</p>
        )}
      </div>
      {right && <div className="ml-auto shrink-0">{right}</div>}
    </div>
  );
}
