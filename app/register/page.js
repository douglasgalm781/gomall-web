"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { HERO_MODEL } from "@/lib/data";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LuxImage from "@/components/LuxImage";

export default function RegisterPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!account.trim()) return toast.warning(t("register.enterAccount"));
    if (!password) return toast.warning(t("register.enterPassword"));
    if (password.length < 6) return toast.warning(t("register.passwordShort"));
    if (password !== confirmPassword) return toast.error(t("register.passwordMismatch"));
    setSubmitting(true);
    try {
      await register(account.trim(), password, inviteCode.trim());
      toast.success(t("register.successMsg"));
      router.replace("/");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="luxe min-h-screen lg:h-screen relative flex flex-col">
      {/* hero image */}
      <div className="absolute inset-x-0 top-0 h-[48%] lg:h-[420px]">
        <LuxImage src={HERO_MODEL} alt="" className="w-full h-full" label="GOMALL" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#0c0a07]" />
      </div>

      {/* top utilities */}
      <div className="relative z-10 flex justify-end gap-2 p-4">
        <Link
          href="/language"
          className="w-10 h-10 rounded-full gold-hairline glass-dark text-gold-300 flex items-center justify-center"
        >
          <Icon name="globe" size={20} />
        </Link>
        <Link
          href="/service"
          className="w-10 h-10 rounded-full gold-hairline glass-dark text-gold-300 flex items-center justify-center"
        >
          <Icon name="headset" size={20} />
        </Link>
      </div>

      {/* brand */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 pt-4 pb-2 lg:flex-none lg:justify-start lg:pt-12 lg:pb-6">
        <Logo size={64} wordmark tagline tone="light" />
        <p className="text-ivory/60 text-[13px] mt-3 tracking-wide">{t("register.subtitle")}</p>
      </div>

      {/* form */}
      <div className="relative z-10 px-6 pb-10 space-y-3 w-full md:max-w-md md:mx-auto lg:flex-1 lg:flex lg:flex-col lg:justify-center">
        {/* account */}
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder={t("register.account")}
          autoComplete="username"
          className="field-dark"
        />

        {/* password */}
        <div className="relative">
          <input
            type={showPwd ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("common.password")}
            autoComplete="new-password"
            className="field-dark pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPwd((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-ivory/70 transition"
            aria-label={showPwd ? t("register.hidePwd") : t("register.showPwd")}
          >
            <Icon name={showPwd ? "eyeOff" : "eye"} size={18} />
          </button>
        </div>

        {/* confirm password */}
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("register.confirmPassword")}
            autoComplete="new-password"
            className="field-dark pr-12"
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-ivory/70 transition"
            aria-label={showConfirm ? t("register.hidePwd") : t("register.showPwd")}
          >
            <Icon name={showConfirm ? "eyeOff" : "eye"} size={18} />
          </button>
        </div>

        {/* invite code */}
        <input
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder={t("register.inviteCode")}
          className="field-dark"
        />

        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full h-[54px] text-[15px] tracking-wide disabled:opacity-60"
        >
          {submitting ? t("common.loading") : t("register.submit")}
        </button>

        <div className="text-center pt-1">
          <span className="text-ivory/50 text-[13px]">{t("register.haveAccount")} </span>
          <Link href="/login" className="text-gold-300 text-[13px] font-semibold">
            {t("register.loginLink")}
          </Link>
        </div>
      </div>
    </div>
  );
}
