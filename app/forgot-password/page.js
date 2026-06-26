"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { HERO_MODEL } from "@/lib/data";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LuxImage from "@/components/LuxImage";

export default function ForgotPasswordPage() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e?.preventDefault();
    if (!contact.trim()) return toast.warning(t("forgot.enterContact"));
    setSubmitting(true);
    try {
      await api.post("/auth/forgot-password", { identifier: contact.trim() });
      toast.success(t("forgot.codeSent"));
      router.push(`/forgot-password/verify?contact=${encodeURIComponent(contact.trim())}`);
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

      <div className="relative z-10 flex justify-start p-4">
        <Link href="/login" className="w-10 h-10 rounded-full gold-hairline glass-dark text-gold-300 flex items-center justify-center">
          <Icon name="chevronLeft" size={20} />
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 lg:flex-none lg:justify-start lg:pt-10 lg:pb-8">
        <Logo size={72} wordmark tagline tone="light" />
      </div>

      <form onSubmit={submit} className="relative z-10 px-6 pb-10 space-y-4 w-full md:max-w-md md:mx-auto lg:flex-1 lg:flex lg:flex-col lg:justify-center">
        <div className="text-center mb-1">
          <h1 className="serif text-[20px] font-bold text-ivory">{t("forgot.title")}</h1>
          <p className="text-ivory/50 text-[13px] mt-1">{t("forgot.subtitle")}</p>
        </div>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          placeholder={t("forgot.contactPlaceholder")}
          autoComplete="username"
          className="field-dark"
        />
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full h-[54px] text-[15px] tracking-wide disabled:opacity-60"
        >
          {submitting ? t("common.loading") : t("forgot.submit")}
        </button>
        <div className="text-center pt-1">
          <span className="text-ivory/50 text-[13px]">{t("forgot.remember")} </span>
          <Link href="/login" className="text-gold-300 text-[13px] font-semibold">{t("login.submit")}</Link>
        </div>
      </form>
    </div>
  );
}
