"use client";
import { useEffect, useState } from "react";
import { api, ApiError, getToken, setToken } from "./api";

// Real, JWT-backed session. The resolved user profile (from
// GET /api/user/me) is cached in localStorage so pages can render
// synchronously, then refreshed from the server on mount and after any
// action that changes balance/kyc/shop/wallet state.

const EVENT = "gomall_session_change";
const CACHE_KEY = "gomall_user";

function readCache() {
  if (typeof window === "undefined") return null;
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
  } catch {
    return null;
  }
}

function writeCache(profile) {
  if (typeof window === "undefined") return;
  if (profile) localStorage.setItem(CACHE_KEY, JSON.stringify(profile));
  else localStorage.removeItem(CACHE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

function mapProfile(user) {
  if (!user) return null;
  const kyc = user.kyc || null;
  const shop = user.shop || null;
  const wallet = user.wallet || null;
  return {
    account: user.account,
    fullName: user.fullName || null,
    avatar: user.avatar || null,
    balance: Number(user.balance),
    wallets: user.wallets || {},
    creditScore: user.creditScore,
    totalCommission: Number(user.totalCommission),
    todayCommission: Number(user.todayCommission ?? 0),
    vip: user.vip,
    kycStatus: kyc?.status ?? null,
    kycData: kyc
      ? {
          name: kyc.full_name,
          idType: kyc.id_type,
          idNumber: kyc.id_number,
          phone: kyc.phone,
          telegram: kyc.telegram,
          whatsapp: kyc.whatsapp,
          email: kyc.email,
          imageUrl: kyc.id_image_url || null,
          imageBackUrl: kyc.id_image_back_url || null,
          submittedAt: kyc.created_at,
        }
      : null,
    isMerchant: !!user.isMerchant,
    shopId: shop?.id ?? null,
    shopStatus: shop?.status ?? null,
    shopRejectionNote: shop?.rejection_note ?? null,
    shopData: shop
      ? {
          id: shop.id,
          name: shop.name,
          desc: shop.description,
          phone: shop.phone,
          telegram: shop.telegram,
          whatsapp: shop.whatsapp,
          logoUrl: shop.logo_url || null,
          rejectionNote: shop.rejection_note || null,
          submittedAt: shop.created_at,
        }
      : null,
    wallet: wallet ? { type: wallet.type, address: wallet.address } : null,
  };
}

// Re-fetches the user profile from the server and updates the cache. Returns
// the mapped profile, or null if there's no token / the token is invalid.
export async function refreshSession() {
  if (!getToken()) {
    writeCache(null);
    return null;
  }
  try {
    const user = await api.get("/user/me");
    const mapped = mapProfile(user);
    writeCache(mapped);
    return mapped;
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setToken(null);
      writeCache(null);
    }
    throw err;
  }
}

export async function login(account, password) {
  const { token, user } = await api.post("/auth/login", { account, password });
  setToken(token);
  writeCache(mapProfile(user));
  return user;
}

export async function register(account, password, inviteCode) {
  const { token, user } = await api.post("/auth/register", {
    account,
    password,
    inviteCode: inviteCode || undefined,
  });
  setToken(token);
  writeCache(mapProfile(user));
  return user;
}

export function logout() {
  setToken(null);
  writeCache(null);
}

// Returns the cached user profile (mapped), refreshing it from the server in
// the background. Returns null while logged out or before the first
// successful fetch.
export function useSession() {
  // Start as `null` on both server and the first client render so hydration
  // matches; the cached profile (read from localStorage, client-only) is
  // applied in the effect below right after mount.
  const [session, setSession] = useState(null);

  useEffect(() => {
    setSession(readCache());
    const handler = () => setSession(readCache());
    window.addEventListener(EVENT, handler);
    if (getToken()) {
      refreshSession().catch(() => {});
    }
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  return session;
}
