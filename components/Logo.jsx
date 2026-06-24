// GoMall crown emblem + wordmark. tone: "gold" (default) | "light" | "dark"
// controls the wordmark/tagline color (emblem is always gold gradient).

export default function Logo({ size = 56, wordmark = false, tagline = false, tone = "gold" }) {
  const wordColor =
    tone === "light" ? "text-ivory" : tone === "dark" ? "text-ink-900" : "gold-text";

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size * 1.05} viewBox="0 0 100 105" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="goldEmblem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f3e2a8" />
            <stop offset="0.45" stopColor="#d8b76a" />
            <stop offset="0.75" stopColor="#b0842c" />
            <stop offset="1" stopColor="#8f6a22" />
          </linearGradient>
        </defs>
        <g fill="url(#goldEmblem)">
          {/* crown */}
          <path d="M22 50 L28 29 L39 41 L50 24 L61 41 L72 29 L78 50 Z" />
          <rect x="25" y="52.5" width="50" height="6.5" rx="2" />
          <circle cx="28" cy="27" r="3.3" />
          <circle cx="50" cy="21.5" r="3.7" />
          <circle cx="72" cy="27" r="3.3" />
        </g>
        {/* serif G */}
        <text
          x="50"
          y="98"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontSize="42"
          fontWeight="700"
          fill="url(#goldEmblem)"
        >
          G
        </text>
      </svg>

      {wordmark && (
        <div
          className={`serif font-bold tracking-[0.04em] leading-none ${wordColor}`}
          style={{ fontSize: size * 0.46, marginTop: size * 0.12 }}
        >
          GoMall
        </div>
      )}
      {tagline && (
        <div
          className={`tracking-[0.32em] uppercase mt-2 ${
            tone === "light" ? "text-gold-300" : "text-gold-600"
          }`}
          style={{ fontSize: Math.max(9, size * 0.16) }}
        >
          Timeless Luxury, Made for You
        </div>
      )}
    </div>
  );
}
