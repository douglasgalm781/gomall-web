"use client";
import { useI18n } from "@/lib/i18n";
import BackHeader from "./BackHeader";

export default function InfoPage({ name }) {
  const { t } = useI18n();
  return (
    <div className="luxe min-h-screen">
      <BackHeader dark title={t(`info.${name}.title`)} />
      <div className="px-4 md:px-8 pt-4 max-w-2xl lg:max-w-3xl mx-auto">
        <div className="card-dark p-5 text-[14px] text-ivory/70 leading-relaxed whitespace-pre-line">
          {t(`info.${name}.body`)}
        </div>
      </div>
    </div>
  );
}
