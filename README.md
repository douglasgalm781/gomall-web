# GoMall — Frontend (Phase A Demo)

Mobile web app (Next.js 14 App Router + Tailwind) matching the client's reference screenshots.
Runs **standalone with mock data** — no backend required yet. The real backend plugs in during Phase B.

## Run

```bash
npm install
npm run dev        # http://localhost:8080  (opens at /login)
```

Best viewed in a mobile viewport (DevTools device toolbar). The layout is locked to a 440px mobile column.

## Screens / routes

| Route | Screen |
|---|---|
| `/login` | Login (account + password, language & service shortcuts, Go!) |
| `/` | Home (welcome, credit score, 8-icon grid, brand exhibition banners) |
| `/start` | Task/Start (today's commission, balance, progress, **order-review modal**) |
| `/orders` | Orders (All / Pending / Completed / Frozen tabs) |
| `/recharge` | Recharge (amount, preset grid, payment methods → **QR display**) |
| `/bind-usdt` | Bind USDT address (wallet-type dropdown) |
| `/profile` | Profile (avatar, balances, menu) |
| `/language` | Language selection (11 languages) |
| `/withdraw` | Withdraw |
| `/records/recharge` · `/records/withdraw` | Recharge / withdrawal records |
| `/service` · `/terms` · `/activity` · `/about` | Customer service & info pages |

## Demo flow to show the client

1. Open `/login` → tap **Go!** (any account works) → lands on Home.
2. Home → tap **开始 (Start)** → tap **开始** to grab an order → fill the review modal → **确定**
   → balance increases (commission credited).
3. Home → **充值 (Recharge)** → enter an amount → pick **USDT-ERC20** → **QR code** is shown
   → **我已支付** → balance auto-updates (simulated callback).
4. **我的 (Profile)** → **绑定USDT地址** → choose wallet type + address.
5. Language selector and order history are all live.

## Multi-language

- Language is switchable live from **Profile → Select Language** or the globe icon on Login.
- The whole UI re-renders in the chosen language (selection persists in `localStorage`).
- Translations live in [lib/i18n.js](lib/i18n.js). `en` is the complete base; **`zh` and the demo locales `es` / `vi` are also wired**. Any missing key falls back to English, so partial locales still render cleanly.
- **Add a language** = add one object in `lib/i18n.js` keyed by its code from `LANGUAGES` in `lib/data.js`. The other 7 listed languages are selectable now and fall back to English until their dictionary is filled (have a native speaker translate before production).

## Brand & theme (hybrid black-&-gold luxury)

Matches the approved reference board: a luxury jewelry storefront.
- **Logo** — [components/Logo.jsx](components/Logo.jsx): crown emblem + serif **GoMall** wordmark + tagline *"Timeless Luxury, Made for You"*. Props: `size`, `wordmark`, `tagline`, `tone` (gold/light/dark).
- **Hybrid theme** — shopping/wallet pages (Home, Start, Orders, Recharge, Withdraw, Bind USDT) use **dark black-&-gold** (`.luxe` background, `.card-dark`, `.field-dark`, `.glass-dark`); account/utility pages (Profile, Language, Support, Records, Info) stay **light** (`.card`, `.field`). `BackHeader` takes a `dark` prop; the tab bar is a dark gold dock.
- **Catalog** — 12 luxury jewelry products with brand, category, price & real CDN photos ([lib/data.js](lib/data.js)); home has category chips (necklaces/rings/earrings/bracelets/watches/bags), a product grid, a hero model banner, a services row, and a trust-badge row — all i18n-driven.

## Design system

**Jewel-tone luxury** look: deep emerald/burgundy/sapphire surfaces, **champagne-gold** accents, Playfair Display serif headings, real luxury photography, and a consistent SVG icon set.

- **Tokens** in [tailwind.config.js](tailwind.config.js) — `gold.*` (champagne scale), `jewel.*` (emerald/burgundy/sapphire), `ivory`/`muted`, `font-serif` (Playfair), and `shadow-gold`/`shadow-lux`.
- **Reusable classes** in [app/globals.css](app/globals.css) — `.card` / `.list-card` (dark glass + gold hairline), `.hero-accent` (jewel mesh + gold ring), `.btn-primary` (gold), `.btn-ghost`, `.field`, `.pill*`, `.glass`, `.gold-text` (gradient gold text), `.gold-hairline`, `.serif`, `.orb`.
- **Imagery** — luxury product/banner/hero photos via Unsplash CDN, defined in [lib/data.js](lib/data.js) (`img()` helper). [components/LuxImage.jsx](components/LuxImage.jsx) renders each photo over a jewel gradient so a failed load never shows a broken image.
- **Depth & detail** — the `.phone` frame is a deep jewel mesh (emerald + burgundy + sapphire glows) with a gold-dust `grain` overlay. Heroes layer floating `.orb` blurs; prices/brand use serif + gold-gradient text. Page roots are transparent; sticky headers frost over the backdrop.
- **Serif font** loaded via Google Fonts in [app/layout.js](app/layout.js); runtime CDN (no build-time fetch).
- **Background** — [components/BackgroundImage.jsx](components/BackgroundImage.jsx) renders a full-screen luxury photo (blurred + heavily darkened + vignetted) behind all content (z-0), with a jewel/gold wash for depth and legibility; falls back to the gradient if the image fails. Change the image via `BACKGROUND_IMAGE` in [lib/data.js](lib/data.js). An animated alternative ([components/BackgroundFX.jsx](components/BackgroundFX.jsx), drifting gold particles) is also included — swap it into [app/layout.js](app/layout.js) to use that instead.
- **Icons** — Lucide-style inline SVGs in [components/Icon.jsx](components/Icon.jsx) (`<Icon name="wallet" />`). No emoji or icon-font dependency.
- **Toasts** — non-blocking, animated notifications via [components/Toast.jsx](components/Toast.jsx). Use `const toast = useToast()` then `toast.success / error / warning / info(message)`. Replaces all native `alert()` dialogs; auto-dismiss with a colored accent bar, icon chip, and manual close.

## Notes
- State (login, balance) is held client-side in `localStorage` for the demo (`lib/store.js`).
- Mock data lives in `lib/data.js`.
- The luxury-brand background is a CSS placeholder — drop in the client's real artwork later.
- **Phase B:** replace `lib/store.js` + mock data with calls to the Node backend
  (order create, QR/address, recharge callback, USDT confirmation).
