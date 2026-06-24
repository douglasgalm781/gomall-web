"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";
import ShippingList from "@/components/ShippingList";

export default function ShippingPage() {
  const router = useRouter();
  const { t }  = useI18n();

  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && !getToken()) router.replace("/login");
  }, [router]);

  useEffect(() => {
    api.get("/shipping")
      .then((data) => setList(data.items || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="luxe min-h-screen pb-24">
      <BackHeader dark title={t("shipping.title")} />

      <div className="max-w-[860px] mx-auto px-4 md:px-8 pt-5">
        {loading ? (
          <div className="text-center text-ivory/40 text-[13px] pt-10">{t("common.loading")}</div>
        ) : list.length === 0 ? (
          <div className="flex flex-col items-center text-center pt-16">
            <div className="w-16 h-16 rounded-3xl hero-accent flex items-center justify-center shadow-gold">
              <Icon name="truck" size={28} className="text-gold-300" />
            </div>
            <p className="text-ivory font-semibold mt-4">{t("shipping.empty")}</p>
            <p className="text-ivory/50 text-[13px] mt-1 max-w-[260px]">{t("shipping.emptyHint")}</p>
          </div>
        ) : (
          <ShippingList list={list} />
        )}
      </div>
    </div>
  );
}
