"use client";
import { useI18n } from "@/lib/i18n";
import BackHeader from "@/components/BackHeader";
import RechargeContent from "@/components/RechargeContent";

export default function RechargePage() {
  const { t } = useI18n();

  return (
    <div className="luxe min-h-screen pb-10">
      <BackHeader title={t("recharge.title")} dark />
      <div className="px-4 pt-4 pb-6 md:max-w-md md:mx-auto">
        <RechargeContent />
      </div>
    </div>
  );
}
