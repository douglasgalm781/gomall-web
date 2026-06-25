"use client";

// Sunburst "seal" sale badge — bold, high-contrast and highly visible (suited
// for promo-heavy markets). Pass the resolved (discounted) price and the
// pre-discount originalPrice; the percent-off is derived from those two.

// Pre-compute a 16-spike sunburst polygon (viewBox 0..100).
function burstPoints(spikes = 16, outer = 50, inner = 39, cx = 50, cy = 50) {
  const pts = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI * i) / spikes - Math.PI / 2;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}
const BURST = burstPoints();

export default function SaleBadge({ onSale, price, originalPrice, size = "sm", className = "" }) {
  if (!onSale || !originalPrice || price == null || price >= originalPrice) return null;
  const pct = Math.round((1 - price / originalPrice) * 100);
  if (pct <= 0) return null;

  const sizes = {
    sm: { box: "w-12 h-12",     pct: "text-[12px]", off: "text-[7px]" },
    md: { box: "w-14 h-14",     pct: "text-[14px]", off: "text-[8px]" },
    lg: { box: "w-[68px] h-[68px]", pct: "text-[18px]", off: "text-[9px]" },
  };
  const s = sizes[size] || sizes.sm;

  return (
    <div
      className={`absolute top-2 left-2 z-[5] ${s.box} flex items-center justify-center drop-shadow-[0_3px_8px_rgba(190,18,60,0.55)] ${className}`}
      aria-label={`${pct}% off`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full">
        <polygon points={BURST} fill="#e11d48" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <div className="relative flex flex-col items-center justify-center leading-none">
        <span className={`font-extrabold text-white tracking-tight ${s.pct}`}>{pct}%</span>
        <span className={`font-bold text-white/90 tracking-[0.12em] ${s.off}`}>OFF</span>
      </div>
    </div>
  );
}
