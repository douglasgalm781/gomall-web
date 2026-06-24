"use client";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/lib/data";
import { useI18n } from "@/lib/i18n";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";

export default function LanguagePage() {
  const router = useRouter();
  const { lang, setLang, t } = useI18n();

  const choose = (code) => {
    setLang(code);
    router.back();
  };

  return (
    <div className="luxe min-h-screen">
      <BackHeader dark title={t("language.title")} />
      <div className="px-4 pt-4 w-full md:max-w-md md:mx-auto">
        <div className="card-dark overflow-hidden divide-y divide-gold-400/10">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => choose(l.code)}
              className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-white/5 transition"
            >
              <span className="w-9 h-9 rounded-xl gold-hairline bg-gold-400/12 text-gold-300 flex items-center justify-center text-[11px] font-semibold uppercase">
                {l.code}
              </span>
              <span className="flex-1 text-left text-[14px] text-ivory/85">{l.label}</span>
              {lang === l.code && <Icon name="check" size={20} className="text-gold-300" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
