"use client";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { HERO_MODEL } from "@/lib/data";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LuxImage from "@/components/LuxImage";

function ResetContent() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const token = useSearchParams().get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!password) return toast.warning(t("login.enterPassword"));
    if (password.length < 6) return toast.warning(t("register.passwordShort"));
    if (password !== confirm) return toast.error(t("register.passwordMismatch"));
    setSubmitting(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success(t("reset.success"));
      router.replace("/login");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="luxe min-h-screen lg:h-screen relative flex flex-col">
      <div className="absolute inset-x-0 top-0 h-[52%] lg:h-[420px]">
        <LuxImage src={HERO_MODEL} alt="" className="w-full h-full" label="GOMALL" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#0c0a07]" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 pt-8 lg:flex-none lg:justify-start lg:pt-10 lg:pb-8">
        <Logo size={72} wordmark tagline tone="light" />
      </div>

      <div className="relative z-10 px-6 pb-10 space-y-4 w-full md:max-w-md md:mx-auto lg:flex-1 lg:flex lg:flex-col lg:justify-center">
        {!token ? (
          <div className="card-dark px-6 py-10 text-center space-y-3">
            <p className="text-[15px] font-semibold text-ivory">{t("reset.invalidLink")}</p>
            <Link href="/forgot-password" className="text-gold-300 text-[13px] font-semibold">{t("reset.requestNew")}</Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-1">
              <h1 className="serif text-[20px] font-bold text-ivory">{t("reset.title")}</h1>
              <p className="text-ivory/50 text-[13px] mt-1">{t("reset.subtitle")}</p>
            </div>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("reset.newPassword")}
                autoComplete="new-password"
                className="field-dark pr-12"
              />
              <button type="button" onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-ivory/70 transition">
                <Icon name={showPwd ? "eyeOff" : "eye"} size={18} />
              </button>
            </div>
            <input
              type={showPwd ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={t("reset.confirmPassword")}
              autoComplete="new-password"
              className="field-dark"
            />
            <button
              type="submit"
              onClick={submit}
              disabled={submitting}
              className="btn-primary w-full h-[54px] text-[15px] tracking-wide disabled:opacity-60"
            >
              {submitting ? t("common.loading") : t("reset.submit")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetContent />
    </Suspense>
  );
}
