"use client";
import Link from "next/link";
import { useI18n } from "@/lib/i18n";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";

export default function ServicePage() {
  const { t } = useI18n();
  return (
    <div className="luxe min-h-screen">
      <BackHeader dark title={t("service.title")} />
      <div className="px-4 md:px-8 pt-8 flex flex-col items-center text-center max-w-2xl lg:max-w-3xl mx-auto">
        <div className="w-20 h-20 rounded-3xl hero-accent flex items-center justify-center shadow-gold">
          <Icon name="headset" size={36} className="text-gold-300" />
        </div>
        <h2 className="serif text-[18px] font-semibold text-ivory mt-5">{t("service.online")}</h2>
        <p className="text-[13px] text-ivory/50 mt-2 max-w-[280px] leading-relaxed">{t("service.desc")}</p>

        <div className="card-dark w-full p-4 mt-6 text-left divide-y divide-gold-400/10">
          {[
            ["Telegram", "@gomall_support"],
            ["Email", "support@gomall.com"],
            [t("service.onlineTime"), "09:00 - 21:00"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between py-2.5 text-[14px]">
              <span className="text-ivory/50">{k}</span>
              <span className="text-ivory font-medium">{v}</span>
            </div>
          ))}
        </div>

        <Link href="/service/chat" className="btn-primary w-full h-[52px] mt-6 flex items-center justify-center gap-2">
          <Icon name="message" size={18} /> {t("service.startChat")}
        </Link>
      </div>
    </div>
  );
}
