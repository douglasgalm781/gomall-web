"use client";

// Small gold-on-crimson ribbon shown in the top-left corner of a product
// image when a sale is currently active. Pass the resolved (discounted)
// price and the pre-discount originalPrice — the percent-off label is
// derived from those two rather than from saleType/saleValue, so it reads
// correctly for both percent and fixed-amount sales.
export default function SaleBadge({ onSale, price, originalPrice, size = "sm", className = "" }) {
  if (!onSale || !originalPrice || price == null || price >= originalPrice) return null;
  const pct = Math.round((1 - price / originalPrice) * 100);
  if (pct <= 0) return null;

  const sizeClasses = {
    sm: "text-[9px] px-1.5 py-[3px]",
    md: "text-[10px] px-2 py-[5px]",
    lg: "text-[12px] px-2.5 py-1.5",
  };

  return (
    <div
      className={`absolute top-2 left-2 z-[5] rounded-md bg-gradient-to-b from-rose-600 to-red-800 shadow-md ${sizeClasses[size] || sizeClasses.sm} ${className}`}
      style={{ clipPath: "polygon(0 0, 100% 0, 100% 65%, 88% 100%, 0 100%)" }}
    >
      <span className="font-bold text-gold-200 tracking-wide leading-none whitespace-nowrap">-{pct}%</span>
    </div>
  );
}
