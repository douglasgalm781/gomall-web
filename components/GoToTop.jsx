"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

export default function GoToTop() {
  const [show, setShow] = useState(false);
  const pathname = usePathname();
  // Product detail pages have a fixed mobile action bar at the bottom — lift
  // the FAB above it so it doesn't overlap the Buy now / Add to Cart buttons.
  const raised = pathname?.startsWith("/product/");

  useEffect(() => {
    const check = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setShow(scrollable > 100 && window.scrollY / scrollable > 0.3);
    };
    window.addEventListener("scroll", check, { passive: true });
    return () => window.removeEventListener("scroll", check);
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className={`fixed ${raised ? "bottom-[160px]" : "bottom-[84px]"} right-4 lg:bottom-6 lg:right-6 z-50 w-11 h-11 rounded-full shadow-lux flex items-center justify-center transition-all duration-300
        bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900
        ${show ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"}`}
    >
      <Icon name="chevronUp" size={20} strokeWidth={2.5} />
    </button>
  );
}
