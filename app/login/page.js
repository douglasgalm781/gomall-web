"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/store";
import { ApiError } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useToast } from "@/components/Toast";
import { HERO_MODEL } from "@/lib/data";
import Icon from "@/components/Icon";
import Logo from "@/components/Logo";
import LuxImage from "@/components/LuxImage";

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!account.trim()) return toast.warning(t("login.enterAccount"));
    if (!password) return toast.warning(t("login.enterPassword"));
    setSubmitting(true);
    try {
      const user = await login(account.trim(), password);
      if (user?.is_merchant) router.push("/merchant");
      else router.push("/");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("common.loadFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="luxe min-h-screen lg:h-screen relative flex flex-col">
      {/* hero image top */}
      <div className="absolute inset-x-0 top-0 h-[52%] lg:h-[420px]">
        <LuxImage src={HERO_MODEL} alt="" className="w-full h-full" label="GOMALL" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-[#0c0a07]" />
      </div>

      {/* top utilities */}
      <div className="relative z-10 flex justify-end gap-2 p-4">
        <Link href="/language" className="w-10 h-10 rounded-full gold-hairline glass-dark text-gold-300 flex items-center justify-center">
          <Icon name="globe" size={20} />
        </Link>
        <Link href="/service" className="w-10 h-10 rounded-full gold-hairline glass-dark text-gold-300 flex items-center justify-center">
          <Icon name="headset" size={20} />
        </Link>
      </div>

      {/* brand */}
      <div className="relative z-10 flex-1 flex flex-col justify-center items-center text-center px-6 lg:flex-none lg:justify-start lg:pt-10 lg:pb-8">
        <Logo size={72} wordmark tagline tone="light" />
      </div>

      {/* form */}
      <div className="relative z-10 px-6 pb-10 space-y-4 w-full md:max-w-md md:mx-auto lg:flex-1 lg:flex lg:flex-col lg:justify-center">
        <input
          value={account}
          onChange={(e) => setAccount(e.target.value)}
          placeholder={t("login.account")}
          className="field-dark"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("common.password")}
          className="field-dark"
        />
        <button
          onClick={submit}
          disabled={submitting}
          className="btn-primary w-full h-[54px] text-[15px] tracking-wide disabled:opacity-60"
        >
          {submitting ? t("common.loading") : t("login.submit")}
        </button>
        <div className="text-center pt-1">
          <span className="text-ivory/50 text-[13px]">{t("login.noAccount")} </span>
          <Link href="/register" className="text-gold-300 text-[13px] font-semibold">{t("login.register")}</Link>
        </div>
        <div className="text-center">
          <Link href="/merchant" className="text-[12px] text-emerald-300/70 hover:text-emerald-300 flex items-center justify-center gap-1.5 transition">
            <span>Manage my store →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
