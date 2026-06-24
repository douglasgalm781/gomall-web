"use client";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import Icon from "./Icon";

export default function BackHeader({ title, right, dark }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div
      className={`sticky top-0 z-20 h-14 flex items-center px-2 ${
        dark ? "glass-dark border-b border-gold-400/15" : "glass border-b border-gold-400/20"
      }`}
    >
      <button
        onClick={() => router.back()}
        className={`w-10 h-10 flex items-center justify-center rounded-full ${
          dark ? "text-gold-300 active:bg-white/5" : "text-gold-600 active:bg-gold-50"
        }`}
        aria-label={t("common.back")}
      >
        <Icon name="chevronLeft" size={24} />
      </button>
      <h1 className={`serif flex-1 text-center text-[17px] font-semibold tracking-wide ${dark ? "text-ivory" : "text-ink-900"}`}>
        {title}
      </h1>
      <div className={`w-10 h-10 flex items-center justify-center ${dark ? "text-gold-300" : "text-gold-600"}`}>{right}</div>
    </div>
  );
}
