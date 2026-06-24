"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

// Fallback rates, used until /api/config responds (or if it fails).
export const CURRENCIES = [
  { code: "USDT-TRC20", symbol: "USDT", label: "USDT/TRC20", rate: 1      },
  { code: "USDT-ERC20", symbol: "USDT", label: "USDT/ERC20", rate: 1      },
  { code: "CNY",        symbol: "¥",    label: "CNY",         rate: 7.24   },
  { code: "USD",        symbol: "$",    label: "USD",         rate: 1      },
  { code: "SGD",        symbol: "S$",   label: "SGD",         rate: 1.35   },
  { code: "VND",        symbol: "₫",    label: "VND",         rate: 25450  },
  { code: "MYR",        symbol: "RM",   label: "MYR",         rate: 4.73   },
  { code: "THB",        symbol: "฿",    label: "THB",         rate: 35.9   },
];

const STORAGE_KEY = "gomall_currency";

// This is a China-first platform — default display currency is CNY (¥).
const DEFAULT_CURRENCY = "CNY";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currencies, setCurrencies] = useState(CURRENCIES);
  const [currency, setCurrencyState] = useState(
    CURRENCIES.find((c) => c.code === DEFAULT_CURRENCY) || CURRENCIES[0]
  );

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const found = CURRENCIES.find((c) => c.code === saved);
      if (found) setCurrencyState(found);
    }

    api
      .get("/config")
      .then((cfg) => {
        if (!cfg?.currencies?.length) return;
        setCurrencies(cfg.currencies);
        const code = localStorage.getItem(STORAGE_KEY) || DEFAULT_CURRENCY;
        const found =
          cfg.currencies.find((c) => c.code === code) ||
          cfg.currencies.find((c) => c.code === DEFAULT_CURRENCY) ||
          cfg.currencies[0];
        if (found) setCurrencyState(found);
      })
      .catch(() => {});
  }, []);

  function setCurrency(c) {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c.code);
  }

  function fmt(usdAmount, compact = false) {
    const raw = usdAmount * currency.rate;
    const isVND  = currency.code === "VND";
    const isUSDT = currency.code === "USDT-TRC20" || currency.code === "USDT-ERC20";

    if (compact) {
      if (raw >= 1_000_000) {
        const v = isVND ? Math.round(raw / 1_000_000) : (raw / 1_000_000).toFixed(1);
        return isUSDT ? `${v}M USDT` : `${currency.symbol}${v}M`;
      }
      if (raw >= 1_000) {
        const v = isVND ? Math.round(raw / 1_000) : (raw / 1_000).toFixed(1);
        return isUSDT ? `${v}k USDT` : `${currency.symbol}${v}k`;
      }
    }

    if (isUSDT)
      return `${raw.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;

    if (isVND)
      return `${currency.symbol}${Math.round(raw).toLocaleString("en-US")}`;

    return `${currency.symbol}${raw.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, fmt, currencies }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}

export function fmtNative(amount, code = 'USD') {
  const n = Number(amount) || 0;
  if (code === 'USDT' || code === 'USDT-TRC20' || code === 'USDT-ERC20') {
    return `${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT`;
  }
  const cur = CURRENCIES.find((c) => c.code === code);
  const sym = cur ? cur.symbol : code + ' ';
  if (code === 'VND') {
    return `${sym}${Math.round(n).toLocaleString('en-US')}`;
  }
  return `${sym}${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
