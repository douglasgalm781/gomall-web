"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import Icon from "@/components/Icon";
import BackHeader from "@/components/BackHeader";

const NOTIF_TITLE_KEYS = {
  "Order Completed":              "notif.orderCompleted",
  "Order Placed":                 "notif.orderPlaced",
  "Withdrawal Completed":         "notif.withdrawCompleted",
  "Withdrawal Rejected":          "notif.withdrawRejected",
  "New message from support":     "notif.newMessageSupport",
  "Shipment pending":             "notif.shipmentPending",
  "Shipment processing":          "notif.shipmentProcessing",
  "Shipment shipped":             "notif.shipmentShipped",
  "Shipment delivered":           "notif.shipmentDelivered",
  "Shipment cancelled":           "notif.shipmentCancelled",
  "Earnings Credited":            "notif.earningsCredited",
  "New message about your order": "notif.newMessageOrder",
  "Recharge Received":            "notif.rechargeReceived",
  "Recharge Approved":            "notif.rechargeApproved",
  "Recharge Rejected":            "notif.rechargeRejected",
};

const TYPE_META = {
  order:    { icon: "bag",       color: "text-gold-300",    bg: "bg-gold-400/15"    },
  recharge: { icon: "deposit",   color: "text-emerald-400", bg: "bg-emerald-500/15" },
  withdraw: { icon: "withdraw",  color: "text-sky-400",     bg: "bg-sky-400/15"     },
  shop:     { icon: "clipboard", color: "text-violet-400",  bg: "bg-violet-400/15"  },
  shipping: { icon: "truck",     color: "text-gold-300",    bg: "bg-gold-400/15"    },
  chat:     { icon: "headset",   color: "text-gold-300",    bg: "bg-gold-400/15"    },
  system:   { icon: "bell",      color: "text-ivory/55",    bg: "bg-white/8"        },
};

export default function NotificationsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [items, setItems] = useState([]);

  useEffect(() => {
    api
      .get("/notifications")
      .then((data) => {
        setItems(data.items || []);
        window.dispatchEvent(new CustomEvent("notifUpdated", { detail: { count: data.unread || 0 } }));
      })
      .catch(() => {});
  }, []);

  const unreadCount = items.filter((n) => !n.read).length;

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    api.post("/notifications/read-all", {}).catch(() => {});
    window.dispatchEvent(new CustomEvent("notifUpdated", { detail: { count: 0 } }));
  };

  const handleTap = (n) => {
    setItems((prev) => {
      const next = prev.map((item) => (item.id === n.id ? { ...item, read: true } : item));
      const remaining = next.filter((item) => !item.read).length;
      window.dispatchEvent(new CustomEvent("notifUpdated", { detail: { count: remaining } }));
      return next;
    });
    if (!n.read) api.post(`/notifications/${n.id}/read`, {}).catch(() => {});
    if (n.href) router.push(n.href);
  };

  return (
    <div className="luxe min-h-screen pb-10">
      {/* ── header ───────────────────────────────────────────────────── */}
      <BackHeader
        title={t("notifications.title")}
        dark
        subtitle={unreadCount > 0 ? `${unreadCount} ${t("notifications.unread")}` : null}
        right={unreadCount > 0 ? (
          <button
            onClick={markAllRead}
            className="text-[12px] font-semibold text-gold-300 py-1.5 px-3 rounded-full gold-hairline bg-white/5"
          >
            {t("notifications.markAllRead")}
          </button>
        ) : null}
      />

      {/* ── list ─────────────────────────────────────────────────────── */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <Icon name="bell" size={44} className="text-gold-300/20 mb-4" />
          <p className="text-[15px] font-semibold text-ivory/50">
            {t("notifications.empty")}
          </p>
          <p className="text-[12px] text-ivory/30 mt-2">
            {t("notifications.emptyHint")}
          </p>
        </div>
      ) : (
        <div className="px-4 md:px-8 lg:px-12 pt-3 max-w-2xl mx-auto space-y-2">
          {items.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.system;
            return (
              <button
                key={n.id}
                onClick={() => handleTap(n)}
                className={`w-full card-dark p-4 flex items-start gap-3 text-left transition active:scale-[0.99] ${
                  !n.read ? "border-gold-400/45" : ""
                }`}
              >
                {/* type icon */}
                <span
                  className={`w-10 h-10 rounded-2xl ${meta.bg} ${meta.color} flex items-center justify-center shrink-0 mt-0.5`}
                >
                  <Icon name={meta.icon} size={18} />
                </span>

                {/* content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-[14px] font-semibold leading-snug ${
                        n.read ? "text-ivory/65" : "text-ivory"
                      }`}
                    >
                      {NOTIF_TITLE_KEYS[n.title] ? t(NOTIF_TITLE_KEYS[n.title]) : n.title}
                    </p>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-gold-400 shrink-0 mt-1.5" />
                    )}
                  </div>
                  <p className="text-[12px] text-ivory/50 mt-1 leading-relaxed line-clamp-2">
                    {n.body}
                  </p>
                  <p className="text-[11px] text-ivory/30 mt-1.5">{new Date(n.createdAt).toLocaleString()}</p>
                </div>

                {n.href && (
                  <Icon
                    name="chevronRight"
                    size={16}
                    className="text-gold-300/30 shrink-0 mt-1"
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
