"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, getToken } from "@/lib/api";
import { useToast } from "./Toast";
import { useI18n } from "@/lib/i18n";

// Polls for new admin chat replies and surfaces a toast, except while the
// user is already viewing the live chat thread.
export default function ChatNotifier() {
  const pathname = usePathname();
  const router = useRouter();
  const toast = useToast();
  const { t } = useI18n();
  const lastIdRef = useRef(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    function poll() {
      if (!getToken()) return;
      api
        .get("/chat")
        .then((data) => {
          const items = data.items || [];
          const lastAdmin = [...items].reverse().find((m) => m.sender === "admin");
          if (!lastAdmin) return;
          if (!initializedRef.current) {
            initializedRef.current = true;
            lastIdRef.current = lastAdmin.id;
            return;
          }
          if (lastAdmin.id !== lastIdRef.current) {
            lastIdRef.current = lastAdmin.id;
            if (pathname !== "/service/chat") {
              toast.info(t("chat.newMessage"), 6000, () => router.push("/service/chat"));
            }
          }
        })
        .catch(() => {});
    }
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, [pathname, router, toast, t]);

  return null;
}
