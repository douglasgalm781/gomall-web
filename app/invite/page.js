"use client";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import BackHeader from "@/components/BackHeader";
import Icon from "@/components/Icon";

const HOW_STEPS = [
  { icon: "link",        titleKey: "invite.step1Title", descKey: "invite.step1Desc" },
  { icon: "user",        titleKey: "invite.step2Title", descKey: "invite.step2Desc" },
  { icon: "coins",       titleKey: "invite.step3Title", descKey: "invite.step3Desc" },
];

const EMPTY_STATS = { totalInvited: 0, activeUsers: 0, bonusEarned: 0 };

export default function InvitePage() {
  const { t } = useI18n();
  const { fmt } = useCurrency();

  const [code, setCode] = useState("");
  const [stats, setStats] = useState(EMPTY_STATS);
  const [invitedUsers, setInvitedUsers] = useState([]);

  useEffect(() => {
    api
      .get("/invite")
      .then((data) => {
        setCode(data.code || "");
        setStats(data.stats || EMPTY_STATS);
        setInvitedUsers(data.invitedUsers || []);
      })
      .catch(() => {});
  }, []);

  const link = `gomall.vip/r/${code}`;

  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const copyText = (text, setter) => {
    const done = () => {
      setter(true);
      toast.success(t("invite.copied"));
      setTimeout(() => setter(false), 2000);
    };
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
    } else {
      fallbackCopy(text, done);
    }
  };

  const fallbackCopy = (text, done) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.cssText = "position:fixed;opacity:0;top:0;left:0";
    document.body.appendChild(el);
    el.select();
    try { document.execCommand("copy"); done(); } catch (_) {}
    document.body.removeChild(el);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: t("invite.shareTitle"),
        text:  t("invite.shareText"),
        url:   `https://${link}`,
      }).catch(() => {});
    } else {
      copyText(`https://${link}`, setLinkCopied);
    }
  };

  return (
    <div className="luxe min-h-screen pb-10">
      <BackHeader title={t("invite.title")} dark />

      <div className="max-w-md mx-auto">

      {/* ── hero banner ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <div className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-ink-800 via-gold-700/30 to-ink-800 gold-hairline">
          <div className="orb w-48 h-48 bg-gold-400/20 -top-12 -right-12" />
          <div className="orb w-32 h-32 bg-gold-600/25 -bottom-8 -left-8" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-gold-400/20 gold-hairline flex items-center justify-center mb-3">
              <Icon name="gift" size={30} className="text-gold-300" />
            </div>
            <h2 className="serif text-[20px] font-bold text-ivory mb-1">{t("invite.title")}</h2>
            <p className="text-[13px] text-ivory/60 leading-relaxed max-w-[260px]">
              {t("invite.subtitle")}
            </p>
            {/* reward pill */}
            <div className="mt-3 flex items-center gap-1.5 bg-gold-400/15 gold-hairline rounded-full px-3 py-1.5">
              <Icon name="zap" size={12} className="text-gold-300" />
              <span className="text-[12px] font-semibold text-gold-300">
                10% commission per referral order
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── invite code card ──────────────────────────────────────────────── */}
      <div className="px-4 pt-3">
        <div className="card-dark p-5">
          <p className="text-[11px] text-ivory/50 uppercase tracking-[0.18em] mb-3">
            {t("invite.yourCode")}
          </p>

          {/* code display */}
          <div className="bg-gradient-to-br from-gold-400/10 to-gold-600/5 gold-hairline rounded-2xl px-5 py-4 mb-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-ivory/35 uppercase tracking-widest mb-1">{t("invite.yourCode")}</p>
              <span className="font-mono text-[28px] font-bold text-gold-300 tracking-[0.18em]">
                {code || "GM-······"}
              </span>
            </div>
            <button
              onClick={() => copyText(code, setCodeCopied)}
              className={`w-11 h-11 rounded-xl gold-hairline flex flex-col items-center justify-center gap-0.5 transition-all ${
                codeCopied
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/6 text-ivory/60 hover:text-ivory"
              }`}
            >
              <Icon name={codeCopied ? "check" : "copy"} size={16} />
              <span className="text-[9px] font-medium leading-none">
                {codeCopied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>

          {/* link row */}
          <div className="flex items-center gap-2 bg-white/4 rounded-xl px-3 py-2.5 mb-4 gold-hairline">
            <Icon name="link" size={13} className="text-gold-300/60 shrink-0" />
            <span className="flex-1 text-[12px] text-ivory/50 truncate font-mono">{link}</span>
            <button
              onClick={() => copyText(`https://${link}`, setLinkCopied)}
              className={`text-[11px] font-semibold shrink-0 transition ${
                linkCopied ? "text-emerald-400" : "text-gold-300 hover:text-gold-200"
              }`}
            >
              {linkCopied ? t("invite.copied") : t("common.copy")}
            </button>
          </div>

          {/* share button */}
          <button
            onClick={handleShare}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-gold-400 to-gold-600 text-ink-900 font-semibold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-gold"
          >
            <Icon name="send" size={16} />
            {t("invite.shareLink")}
          </button>
        </div>
      </div>

      {/* ── stats row ─────────────────────────────────────────────────────── */}
      <div className="px-4 pt-3">
        <div className="card-dark p-4 grid grid-cols-3 divide-x divide-gold-400/15">
          {[
            { label: t("invite.statsInvited"), value: stats.totalInvited },
            { label: t("invite.statsActive"),  value: stats.activeUsers },
            {
              label: t("invite.statsBonus"),
              value: fmt(stats.bonusEarned),
            },
          ].map(({ label, value }) => (
            <div key={label} className="text-center px-2">
              <div className="text-[20px] font-bold gold-text tracking-tight">{value}</div>
              <div className="text-[10px] text-ivory/45 mt-0.5 leading-tight">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── how it works ──────────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <h2 className="text-[13px] font-semibold text-ivory/70 mb-3 px-1">{t("invite.howTitle")}</h2>
        <div className="card-dark divide-y divide-gold-400/10">
          {HOW_STEPS.map((step, i) => (
            <div key={i} className="flex items-start gap-4 p-4">
              {/* step number + icon */}
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-9 h-9 rounded-xl bg-gold-400/15 gold-hairline flex items-center justify-center">
                  <Icon name={step.icon} size={16} className="text-gold-300" />
                </div>
                <span className="serif text-[10px] font-bold text-gold-400/60">{i + 1}</span>
              </div>
              <div className="pt-1">
                <p className="text-[13px] font-semibold text-ivory">{t(step.titleKey)}</p>
                <p className="text-[12px] text-ivory/50 mt-0.5 leading-relaxed">{t(step.descKey)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── referrals list ────────────────────────────────────────────────── */}
      <div className="px-4 pt-4">
        <h2 className="text-[13px] font-semibold text-ivory/70 mb-3 px-1">{t("invite.friendsTitle")}</h2>

        {invitedUsers.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center">
            <Icon name="users" size={36} className="text-gold-300/20 mb-3" />
            <p className="text-[14px] text-ivory/50">{t("invite.noFriends")}</p>
            <p className="text-[12px] text-ivory/30 mt-1">{t("invite.noFriendsHint")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {invitedUsers.map((u, i) => (
              <div key={i} className="card-dark px-4 py-3 flex items-center gap-3">
                {/* avatar */}
                <div className="w-10 h-10 rounded-full bg-white/8 gold-hairline flex items-center justify-center shrink-0">
                  <Icon name="user" size={18} className="text-ivory/50" />
                </div>

                {/* info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-ivory">{u.account}</span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        u.active
                          ? "bg-emerald-500/15 text-emerald-400"
                          : "bg-white/8 text-ivory/40"
                      }`}
                    >
                      {u.active ? t("invite.active") : t("invite.inactive")}
                    </span>
                  </div>
                  <p className="text-[11px] text-ivory/35 mt-0.5">
                    {t("invite.joined")} {new Date(u.joinedAt).toLocaleDateString()}
                  </p>
                </div>

                {/* bonus */}
                <div className="text-right shrink-0">
                  {u.bonus > 0 ? (
                    <>
                      <div className="text-[13px] font-semibold text-emerald-400 serif">
                        +{fmt(u.bonus)}
                      </div>
                      <div className="text-[10px] text-ivory/35">{t("invite.bonusEarned")}</div>
                    </>
                  ) : (
                    <span className="text-[12px] text-ivory/25">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>{/* end max-w-md */}
    </div>
  );
}
