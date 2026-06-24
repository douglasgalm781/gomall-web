"use client";
import { useEffect, useState } from "react";
import { WALLET_TYPES } from "@/lib/data";
import { useSession, refreshSession } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import toast from "react-hot-toast";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";

export default function BindUsdtPage() {
  const { t } = useI18n();
  const session = useSession();
  const existing = session?.wallet ?? null;

  const [type,    setType]    = useState(existing?.type    ?? "");
  const [address, setAddress] = useState(existing?.address ?? "");
  const [saving,  setSaving]  = useState(false);

  useEffect(() => {
    if (existing) {
      setType(existing.type ?? "");
      setAddress(existing.address ?? "");
    }
  }, [existing?.type, existing?.address]);

  const save = async () => {
    if (!type)    return toast.error(t("bind.selectType"));
    if (!address) return toast.error(t("bind.enterAddress"));
    setSaving(true);
    try {
      await api.put("/user/wallet", { type, address });
      await refreshSession();
      toast.success(`${t("bind.boundMsg")} · ${type}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="luxe min-h-screen">
      <BackHeader title={t("bind.title")} dark />

      <div className="px-4 pt-4 md:max-w-md md:mx-auto">
        <div className="card-dark p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-9 h-9 rounded-xl gold-hairline bg-white/5 text-gold-300 flex items-center justify-center">
              <Icon name="coins" size={18} />
            </span>
            <h2 className="serif text-[15px] font-semibold text-ivory">{t("bind.yourInfo")}</h2>
          </div>

          <label className="text-[12px] font-medium text-gold-300/80 tracking-wide uppercase">
            {t("bind.walletType")}
          </label>
          <div className="relative mt-2">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="field-dark appearance-none pr-10"
            >
              <option value="">{t("bind.selectType")}</option>
              {WALLET_TYPES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
            <Icon
              name="chevronRight"
              size={18}
              className="text-gold-300/50 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
            />
          </div>

          <label className="text-[12px] font-medium text-gold-300/80 tracking-wide uppercase block mt-4">
            {t("bind.enterAddress")}
          </label>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder={t("bind.enterAddress")}
            className="field-dark mt-2"
          />
        </div>

        {existing && (
          <div className="flex items-center gap-2 mt-4 px-1 text-[12px] text-ivory/45">
            <Icon name="checkCircle" size={14} className="text-emerald-400 shrink-0" />
            <span>Currently bound: <span className="text-ivory/65 font-medium">{existing.type}</span></span>
          </div>
        )}

        <button onClick={save} disabled={saving} className="btn-primary w-full h-[52px] mt-4 disabled:opacity-60">
          {saving ? t("common.loading") : t("bind.save")}
        </button>
      </div>
    </div>
  );
}
