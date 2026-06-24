import Icon from "./Icon";

function getPages(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, "…", total];
  if (current >= total - 3) return [1, "…", total - 4, total - 3, total - 2, total - 1, total];
  return [1, "…", current - 1, current, current + 1, "…", total];
}

function NavBtn({ onClick, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-9 h-9 rounded-xl flex items-center justify-center gold-hairline transition-all ${
        disabled
          ? "opacity-25 cursor-not-allowed text-ivory/40"
          : "text-ivory/60 hover:text-ivory hover:bg-white/10"
      }`}
    >
      {children}
    </button>
  );
}

export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const pages = getPages(page, totalPages);

  const go = (n) => {
    if (n < 1 || n > totalPages) return;
    onChange(n);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="flex items-center justify-center gap-1.5 pt-10 pb-2 select-none">
      <NavBtn onClick={() => go(page - 1)} disabled={page === 1}>
        <Icon name="chevronLeft" size={15} />
      </NavBtn>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="w-9 text-center text-ivory/30 text-[13px]">…</span>
        ) : (
          <button
            key={p}
            onClick={() => go(p)}
            className={`w-9 h-9 rounded-xl text-[13px] font-semibold transition-all ${
              p === page
                ? "bg-gradient-to-b from-gold-300 to-gold-500 text-ink-900 shadow-sm"
                : "gold-hairline bg-white/5 text-ivory/60 hover:text-ivory hover:bg-white/10"
            }`}
          >
            {p}
          </button>
        )
      )}

      <NavBtn onClick={() => go(page + 1)} disabled={page === totalPages}>
        <Icon name="chevronRight" size={15} />
      </NavBtn>
    </div>
  );
}
