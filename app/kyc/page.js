"use client";
import { useState } from "react";
import { useSession, refreshSession } from "@/lib/store";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";

function FieldRow({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">
        {label}
      </label>
      {children}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-gold-400/10 last:border-0">
      <span className="text-[13px] text-ivory/50">{label}</span>
      <span className="text-[13px] font-medium text-ivory text-right max-w-[60%]">{value || "—"}</span>
    </div>
  );
}

export default function KycPage() {
  const session = useSession();
  const { t } = useI18n();
  const toast = useToast();

  const [name, setName] = useState("");
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [telegram, setTelegram] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const kycStatus = session?.kycStatus ?? "none";
  const kycData = session?.kycData;

  const submit = async () => {
    if (!name.trim()) return toast.warning(t("kyc.enterName"));
    if (!idType) return toast.warning(t("kyc.selectIdType"));
    if (!idNumber.trim()) return toast.warning(t("kyc.enterIdNumber"));
    if (!phone.trim()) return toast.warning(t("kyc.enterPhone"));
    setSubmitting(true);
    try {
      await api.post("/kyc", { name: name.trim(), idType, idNumber: idNumber.trim(), phone: phone.trim(), telegram, whatsapp, email });
      await refreshSession();
      toast.success(t("kyc.successMsg"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Pending state ──────────────────────────────────────────────────────────
  if (kycStatus === "pending") {
    return (
      <div className="luxe min-h-screen pb-10">
        <BackHeader title={t("kyc.title")} dark />
        <div className="px-4 pt-4 space-y-4 md:max-w-md md:mx-auto">
          {/* status banner */}
          <div className="card-dark p-5 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-full bg-gold-400/15 gold-hairline flex items-center justify-center mb-3">
              <Icon name="clock" size={26} className="text-gold-300" />
            </span>
            <span className="pill pill-warning text-[12px] mb-2">{t("kyc.statusPending")}</span>
            <h2 className="serif text-[17px] font-semibold text-ivory mt-1">{t("kyc.pendingTitle")}</h2>
            <p className="text-[13px] text-ivory/55 mt-2 leading-relaxed max-w-[280px]">{t("kyc.pendingDesc")}</p>
          </div>

          {/* submitted info */}
          {kycData && (
            <div className="card-dark p-4">
              <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase mb-3">
                {t("kyc.sectionPersonal")}
              </p>
              <InfoRow label={t("kyc.fullName")} value={kycData.name} />
              <InfoRow label={t("kyc.idType")} value={kycData.idType === "card" ? t("kyc.idTypeCard") : t("kyc.idTypePassport")} />
              <InfoRow label={t("kyc.idNumber")} value={kycData.idNumber} />
              <InfoRow label={t("kyc.phone")} value={kycData.phone} />
              {(kycData.telegram || kycData.whatsapp || kycData.email) && (
                <>
                  <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase mt-4 mb-3">
                    {t("kyc.sectionContact")}
                  </p>
                  {kycData.telegram && <InfoRow label="Telegram" value={kycData.telegram} />}
                  {kycData.whatsapp && <InfoRow label="WhatsApp" value={kycData.whatsapp} />}
                  {kycData.email && <InfoRow label="Email" value={kycData.email} />}
                </>
              )}
              <div className="mt-3 pt-3 border-t border-gold-400/10 flex justify-between">
                <span className="text-[12px] text-ivory/40">{t("kyc.submittedAt")}</span>
                <span className="text-[12px] text-ivory/60">{kycData.submittedAt}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Verified state ─────────────────────────────────────────────────────────
  if (kycStatus === "verified") {
    return (
      <div className="luxe min-h-screen pb-10">
        <BackHeader title={t("kyc.title")} dark />
        <div className="px-4 pt-4 space-y-4 md:max-w-md md:mx-auto">
          <div className="card-dark p-5 flex flex-col items-center text-center">
            <span className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-3">
              <Icon name="shieldCheck" size={26} className="text-emerald-400" />
            </span>
            <span className="pill pill-success text-[12px] mb-2">{t("kyc.statusVerified")}</span>
            <h2 className="serif text-[17px] font-semibold text-ivory mt-1">{t("kyc.verifiedTitle")}</h2>
            <p className="text-[13px] text-ivory/55 mt-2 leading-relaxed max-w-[280px]">{t("kyc.verifiedDesc")}</p>
          </div>

          {kycData && (
            <div className="card-dark p-4">
              <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase mb-3">
                {t("kyc.sectionPersonal")}
              </p>
              <InfoRow label={t("kyc.fullName")} value={kycData.name} />
              <InfoRow label={t("kyc.idType")} value={kycData.idType === "card" ? t("kyc.idTypeCard") : t("kyc.idTypePassport")} />
              <InfoRow label={t("kyc.idNumber")} value={kycData.idNumber} />
              <InfoRow label={t("kyc.phone")} value={kycData.phone} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Form state (default) ───────────────────────────────────────────────────
  return (
    <div className="luxe min-h-screen pb-10">
      <BackHeader title={t("kyc.title")} dark />

      <div className="px-4 pt-4 space-y-4">
        {/* subtitle banner */}
        <div className="card-dark px-4 py-3 flex items-center gap-3">
          <Icon name="idCard" size={20} className="text-gold-300 shrink-0" />
          <p className="text-[12px] text-ivory/60 leading-relaxed">{t("kyc.subtitle")}</p>
        </div>

        {/* personal info */}
        <div className="card-dark p-5 space-y-4">
          <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">
            {t("kyc.sectionPersonal")}
          </p>

          <FieldRow label={t("kyc.fullName")}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("kyc.fullName")}
              className="field-dark"
            />
          </FieldRow>

          <FieldRow label={t("kyc.idType")}>
            <div className="relative">
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="field-dark appearance-none pr-10"
              >
                <option value="">{t("kyc.selectPlaceholder")}</option>
                <option value="card">{t("kyc.idTypeCard")}</option>
                <option value="passport">{t("kyc.idTypePassport")}</option>
              </select>
              <Icon
                name="chevronRight"
                size={18}
                className="text-gold-300/50 absolute right-3 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none"
              />
            </div>
          </FieldRow>

          <FieldRow label={t("kyc.idNumber")}>
            <input
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder={t("kyc.idNumber")}
              className="field-dark"
            />
          </FieldRow>

          <FieldRow label={t("kyc.phone")}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t("kyc.phone")}
              inputMode="tel"
              className="field-dark"
            />
          </FieldRow>
        </div>

        {/* contact info */}
        <div className="card-dark p-5 space-y-4">
          <p className="text-[11px] font-semibold text-gold-300/70 tracking-widest uppercase">
            {t("kyc.sectionContact")}
          </p>

          <FieldRow label="Telegram">
            <input
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
              placeholder={t("kyc.telegramPlaceholder")}
              className="field-dark"
            />
          </FieldRow>

          <FieldRow label="WhatsApp">
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder={t("kyc.whatsappPlaceholder")}
              inputMode="tel"
              className="field-dark"
            />
          </FieldRow>

          <FieldRow label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("kyc.emailPlaceholder")}
              inputMode="email"
              className="field-dark"
            />
          </FieldRow>
        </div>

        {/* note */}
        <div className="flex gap-2.5 px-1">
          <Icon name="lock" size={15} className="text-gold-300/50 shrink-0 mt-0.5" />
          <p className="text-[12px] text-ivory/40 leading-relaxed">{t("kyc.note")}</p>
        </div>

        <button onClick={submit} disabled={submitting} className="btn-primary w-full h-[52px] text-[15px] disabled:opacity-60">
          {submitting ? t("common.loading") : t("kyc.submit")}
        </button>
      </div>
    </div>
  );
}
