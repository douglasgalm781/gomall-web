"use client";
import { createContext, useContext, useCallback, useMemo, useState } from "react";
import Icon from "./Icon";

const ToastContext = createContext({
  show: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

let counter = 0;

const VARIANTS = {
  success: { icon: "checkCircle", chip: "bg-emerald-500/15 text-emerald-400", bar: "bg-emerald-500" },
  error:   { icon: "alert",       chip: "bg-red-500/15 text-red-400",         bar: "bg-red-500"     },
  warning: { icon: "alert",       chip: "bg-gold-400/15 text-gold-300",       bar: "bg-gold-400"    },
  info:    { icon: "info",        chip: "bg-gold-400/15 text-gold-300",       bar: "bg-gold-400"    },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.map((tt) => (tt.id === id ? { ...tt, leaving: true } : tt)));
    setTimeout(() => setToasts((prev) => prev.filter((tt) => tt.id !== id)), 220);
  }, []);

  const show = useCallback(
    (message, type = "info", duration = 2800, onClick) => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, type, onClick }]);
      setTimeout(() => remove(id), duration);
      return id;
    },
    [remove]
  );

  const api = useMemo(() => ({
    show,
    success: (m, d, onClick) => show(m, "success", d, onClick),
    error: (m, d, onClick) => show(m, "error", d, onClick),
    warning: (m, d, onClick) => show(m, "warning", d, onClick),
    info: (m, d, onClick) => show(m, "info", d, onClick),
  }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Toaster */}
      <div className="fixed top-3 left-1/2 -translate-x-1/2 w-full max-w-phone md:max-w-[768px] lg:max-w-app px-3 z-[70] flex flex-col items-center gap-2 pointer-events-none">
        {toasts.map((tt) => {
          const v = VARIANTS[tt.type] || VARIANTS.info;
          return (
            <div
              key={tt.id}
              onClick={
                tt.onClick
                  ? () => {
                      tt.onClick();
                      remove(tt.id);
                    }
                  : undefined
              }
              className={`pointer-events-auto w-full max-w-[380px] bg-[#1c1610] border border-gold-400/20 rounded-2xl shadow-lux overflow-hidden backdrop-blur-xl ${
                tt.onClick ? "cursor-pointer" : ""
              } ${tt.leaving ? "toast-out" : "toast-in"}`}
              role="status"
            >
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${v.chip}`}>
                  <Icon name={v.icon} size={18} />
                </span>
                <p className="flex-1 text-[13.5px] leading-snug text-ivory/90 whitespace-pre-line">{tt.message}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(tt.id);
                  }}
                  className="w-7 h-7 flex items-center justify-center text-ivory/30 hover:text-ivory/70 transition shrink-0"
                  aria-label="close"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
              <div className={`h-[2px] w-full ${v.bar} opacity-60`} />
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
