"use client";
import { usePathname } from "next/navigation";

const NO_SPACER_PATHS = ["/service/chat"];

export default function LayoutSpacer() {
  const pathname = usePathname();
  if (NO_SPACER_PATHS.some((p) => pathname?.startsWith(p))) return null;
  return <div className="h-16 lg:hidden" aria-hidden="true" />;
}
