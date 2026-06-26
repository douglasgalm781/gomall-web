"use client";
import { Suspense, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { HERO_MODEL } from "@/lib/data";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LuxImage from "@/components/LuxImage";

function VerifyContent() {
  const { t } = useI18n();
  const toast = useToast();
  const router = useRouter();
  const contact = useSearchParams().get("contact") || "";

  const OTP_LEN = 5;
  const [digits, setDigits] = useState(Array(OTP_LEN).fill(""));
  const inputsRef = useRef([]);
  const code = digits.join("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const setDigit = (i, ch) => setDigits((p) => { const n = [...p]; n[i] = ch; return n; });

  function handleChange(i, val) {
    const v = val.replace(/\D/g, "");
    if (!v) { setDigit(i, ""); return; }
    setDigit(i, v[v.length - 1]);
    if (i < OTP_LEN - 1) inputsRef.current[i + 1]?.focus();
  }
  function handleKeyDown(i, e) {
    if (e.key === "Backspace") {
      if (digits[i]) { setDigit(i, ""); }
      else if (i > 0) { inputsRef.current[i - 1]?.focus(); setDigit(i - 1, ""); }
    } else if (e.key === "ArrowLeft" && i > 0) {
      inputsRef.current[i - 1]?.focus();
    } else if (e.key === "ArrowRight" && i < OTP_LEN - 1) {
      inputsRef.current[i + 1]?.focus();
    }
  }
  function handlePaste(e) {
    const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, OTP_LEN);
    if (!text) return;
    e.preventDefault();
    const n = Array(OTP_LEN).fill("");
    for (let k = 0; k < text.length; k++) n[k] = text[k];
    setDigits(n);
    inputsRef.current[Math.min(text.length, OTP_LEN - 1)]?.focus();
  }

  const submit = async (e) => {
    e?.preventDefault();
    if (!code.trim()) return toast.warning(t("verify.enterCode"));
    setSubmitting(true);
    try {
      const { token } = await api.post("/auth/verify-reset-code", { identifier: contact, code: code.trim() });
      router.replace(`/reset-password?token=${token}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const resend = async () => {
    if (!contact) return;
    setResending(true);
    try {
      await api.post("/auth/forgot-password", { identifier: contact });
      toast.success(t("forgot.codeSent"));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="luxe min-h-screen lg:h-screen relative flex flex-col">
      <div className="absolute inset-x-0 top-0 h-[52%] lg:h-[420px]">
        <LuxImage src={HERO_MODEL} alt="" className="w-full h-full" label="GOMALL" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#0c0a07]" />
      </div>

      <div className="relative z-10 flex justify-start p-4">
        <Link href="/forgot-password" className="w-10 h-10 rounded-full gold-hairline glass-dark text-gold-300 flex items-center justify-center">
          <Icon name="chevronLeft" size={20} />
        </Link>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 lg:flex-none lg:justify-start lg:pt-10 lg:pb-8">
        <Logo size={72} wordmark tagline tone="light" />
      </div>

      <form onSubmit={submit} className="relative z-10 px-6 pb-10 space-y-4 w-full md:max-w-md md:mx-auto lg:flex-1 lg:flex lg:flex-col lg:justify-center">
        <div className="text-center mb-1">
          <h1 className="serif text-[20px] font-bold text-ivory">{t("verify.title")}</h1>
          <p className="text-ivory/50 text-[13px] mt-1">
            {t("verify.subtitle")}{contact ? <> <span className="text-ivory/75">{contact}</span></> : null}
          </p>
        </div>
        <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputsRef.current[i] = el)}
              value={d}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label={`Digit ${i + 1}`}
              className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-[24px] font-bold rounded-xl bg-[#1c1610] text-ivory outline-none border transition focus:border-gold-400 focus:ring-2 focus:ring-gold-400/30 ${d ? "border-gold-400/60" : "border-gold-400/20"}`}
            />
          ))}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="btn-primary w-full h-[54px] text-[15px] tracking-wide disabled:opacity-60"
        >
          {submitting ? t("common.loading") : t("verify.submit")}
        </button>
        <div className="text-center pt-1">
          <button type="button" onClick={resend} disabled={resending} className="text-gold-300 text-[13px] font-semibold disabled:opacity-50">
            {resending ? t("common.loading") : t("verify.resend")}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function VerifyResetCodePage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
