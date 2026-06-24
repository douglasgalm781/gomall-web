// Mock data for the demo. In Phase B these come from the backend API.

// Luxury imagery via Unsplash CDN. img() builds an optimized URL; if a photo
// fails to load, components layer it over a jewel gradient so nothing breaks.
const U = "https://images.unsplash.com/photo-";
export const img = (id, w = 600) => `${U}${id}?auto=format&fit=crop&w=${w}&q=80`;

export const HERO_IMAGE = img("1515562141207-7a88fb7ce338", 900); // jewelry / gold
export const HERO_MODEL = img("1535632787350-4e68ef0ac584", 900); // model wearing jewelry
// Full-screen ambient background (rendered very faint behind everything).
export const BACKGROUND_IMAGE = img("1523275335684-37898b6baf30", 1400); // soft light marble + gold

// Product categories — labels resolved via i18n (`cat.<key>`).
// Kept as a fallback default; the live list is fetched from /config/categories
// so admin-managed categories (added/renamed/removed) show up automatically.
export const CATEGORIES = [
  { key: "all" },
  { key: "necklaces" },
  { key: "rings" },
  { key: "earrings" },
  { key: "bracelets" },
  { key: "watches" },
  { key: "bags" },
];

// Curated icon/gradient per category for the handful of categories we designed
// for. Categories added later via the admin fall back to a generic look.
export const CATEGORY_ICONS = {
  all: "bag",
  necklaces: "heart",
  rings: "star",
  earrings: "zap",
  bracelets: "link",
  watches: "clock",
  bags: "bag",
};
export const CATEGORY_GRADIENTS = {
  all: "from-gold-400/20 to-gold-600/8",
  necklaces: "from-pink-400/15 to-rose-600/8",
  rings: "from-amber-400/15 to-yellow-600/8",
  earrings: "from-violet-400/15 to-purple-600/8",
  bracelets: "from-cyan-400/15 to-blue-600/8",
  watches: "from-emerald-400/15 to-teal-600/8",
  bags: "from-orange-400/15 to-red-600/8",
};
export const DEFAULT_CATEGORY_ICON = "gift";
export const DEFAULT_CATEGORY_GRADIENT = "from-slate-400/15 to-slate-600/8";

// Falls back to a title-cased version of the raw key, e.g. "rings-special" -> "Rings Special".
export function humanizeCategory(key) {
  return String(key).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Resolves a category's display label via i18n, falling back to a humanized
// raw name for categories added after launch that have no translation entry.
export function categoryLabel(t, key) {
  if (key === "all") return t("cat.all");
  const translated = t(`cat.${key}`);
  return translated === `cat.${key}` ? humanizeCategory(key) : translated;
}

// Trust badges (home footer) — labels via i18n (`trust.<key>`).
export const TRUST_BADGES = [
  { key: "authentic", icon: "shield" },
  { key: "secure", icon: "lock" },
  { key: "shipping", icon: "truck" },
  { key: "vip", icon: "crown" },
];
export const BRAND_NAMES = [
  "CARTIER", "ROLEX", "BVLGARI", "HERMÈS", "CHANEL", "DIOR",
];

export const USER = {
  account: "789789",
  creditScore: 100,
  todayCommission: 86.4,
  balance: 12480.0,
  totalCommission: 1148.6,
};

export const PRODUCTS = [
  {
    id: "p1",
    brand: "Tiffany & Co.",
    category: "necklaces",
    title: "18K Gold Heart Diamond Pendant Necklace",
    image: img("1599643478518-a784e5dc4c8f"),
    amount: 2850.0,
    retail: 3280.0,
    commission: 28.5,
    stock: 42,
    rating: 4.8,
    reviewCount: 127,
    desc: "Crafted in 18K gold with a brilliant-cut diamond heart, this Tiffany pendant embodies romantic elegance. Includes signature Tiffany blue box and certificate of authenticity.",
  },
  {
    id: "p2",
    brand: "Bvlgari",
    category: "rings",
    title: "Serpenti Viper 18K Rose Gold Diamond Pavé Ring",
    image: img("1605100804763-247f67b3557e"),
    amount: 8900.0,
    retail: 10200.0,
    commission: 89.0,
    stock: 18,
    rating: 4.9,
    reviewCount: 84,
    desc: "The Serpenti Viper ring wraps the finger in 18K rose gold, fully pavé-set with round brilliant diamonds — a bold symbol of Bulgari's Italian craftsmanship.",
  },
  {
    id: "p3",
    brand: "Cartier",
    category: "earrings",
    title: "Diamond Hoop Earrings · 18K White Gold",
    image: img("1635767798638-3e25273a8236"),
    amount: 1230.0,
    retail: 1450.0,
    commission: 12.3,
    stock: 65,
    rating: 4.7,
    reviewCount: 203,
    desc: "Classic Cartier hoops in 18K white gold, each pavé-set with brilliant-cut diamonds that catch the light with every movement. Timeless and wearable.",
  },
  {
    id: "p4",
    brand: "Van Cleef",
    category: "bracelets",
    title: "Perlée Diamond Tennis Bracelet · Yellow Gold",
    image: img("1611591437281-460bfbe1220a"),
    amount: 4950.0,
    retail: 5680.0,
    commission: 49.5,
    stock: 31,
    rating: 4.8,
    reviewCount: 156,
    desc: "The Perlée collection's iconic bead motif in 18K yellow gold, pavé-set with precision-cut diamonds along the full length of the bracelet.",
  },
  {
    id: "p5",
    brand: "Cartier",
    category: "watches",
    title: "Tank Louis Cartier · 18K Yellow Gold Automatic",
    image: img("1523275335684-37898b6baf30"),
    amount: 12400.0,
    retail: 14200.0,
    commission: 124.0,
    stock: 9,
    rating: 4.9,
    reviewCount: 61,
    desc: "An icon of watchmaking since 1917, reborn in 18K yellow gold. The in-house mechanical movement and sapphire crystal reflect Cartier's century-long mastery.",
  },
  {
    id: "p6",
    brand: "Rolex",
    category: "watches",
    title: "Day-Date 36 · 18K Everose Gold President",
    image: img("1614164185128-e4ec99c436d7"),
    amount: 38900.0,
    retail: 44800.0,
    commission: 389.0,
    stock: 5,
    rating: 5.0,
    reviewCount: 38,
    desc: "The iconic 'President' watch in Everose gold with the signature Day-Date display. Powered by the Rolex Calibre 3255 with a 70-hour power reserve.",
  },
  {
    id: "p7",
    brand: "Hermès",
    category: "bags",
    title: "Kelly 25 Sellier Epsom Leather · Gold Hardware",
    image: img("1584917865442-de89df76afd3"),
    amount: 21500.0,
    retail: 24800.0,
    commission: 215.0,
    stock: 7,
    rating: 4.9,
    reviewCount: 52,
    desc: "Handcrafted at the Hermès atelier in Paris, the Kelly 25 in Epsom leather with gold hardware comes with padlock, keys, and clochette. A true investment piece.",
  },
  {
    id: "p8",
    brand: "Chanel",
    category: "bags",
    title: "Classic Flap Medium · Lambskin & Gold Hardware",
    image: img("1591348122449-02525d70379b"),
    amount: 10200.0,
    retail: 11800.0,
    commission: 102.0,
    stock: 14,
    rating: 4.8,
    reviewCount: 89,
    desc: "The medium Classic Flap in quilted lambskin with interlocking CC clasp in gold-tone hardware. Chanel's most iconic bag, a timeless symbol of Parisian elegance.",
  },
  {
    id: "p9",
    brand: "Graff",
    category: "necklaces",
    title: "Diamond Rivière Necklace · Platinum Setting",
    image: img("1611652022419-a9419f74343d"),
    amount: 28600.0,
    retail: 32800.0,
    commission: 286.0,
    stock: 6,
    rating: 4.9,
    reviewCount: 43,
    desc: "A continuous rivière of D-IF round brilliant diamonds set in platinum, radiating exceptional clarity and fire. Each stone hand-selected by Graff's master gemologists.",
  },
  {
    id: "p10",
    brand: "Harry Winston",
    category: "rings",
    title: "Solitaire Round Brilliant Diamond Engagement Ring",
    image: img("1602173574767-37ac01994b2a"),
    amount: 18900.0,
    retail: 21600.0,
    commission: 189.0,
    stock: 11,
    rating: 4.9,
    reviewCount: 67,
    desc: "A round brilliant diamond of exceptional cut precision, set in Harry Winston's signature platinum prong setting. Includes GIA certificate and luxury packaging.",
  },
  {
    id: "p11",
    brand: "Tiffany & Co.",
    category: "earrings",
    title: "Soleste Pear Diamond Drop Earrings",
    image: img("1535632066927-ab7c9ab60908"),
    amount: 6700.0,
    retail: 7700.0,
    commission: 67.0,
    stock: 23,
    rating: 4.7,
    reviewCount: 134,
    desc: "Pear-shaped diamonds at center, each surrounded by a brilliant pavé halo, mounted in platinum. A modern classic from Tiffany's Soleste collection.",
  },
  {
    id: "p12",
    brand: "Bvlgari",
    category: "bracelets",
    title: "B.zero1 18K Gold Cuff Bracelet",
    image: img("1602751584552-8ba73aad10e1"),
    amount: 5400.0,
    retail: 6200.0,
    commission: 54.0,
    stock: 29,
    rating: 4.8,
    reviewCount: 108,
    desc: "The B.zero1 cuff in 18K yellow gold — a bold architectural statement inspired by Rome's Colosseum, with the iconic Bulgari logo embossed on the spiral band.",
  },
];

// Notification types: order | recharge | withdraw | shop | system
export const NOTIFICATIONS = [
  {
    id: "n1",
    type: "order",
    title: "Order Completed",
    body: "Your task order #ord_01J9ZB has been completed. Commission +$28.50 has been credited to your balance.",
    href: "/orders",
    date: "2026-06-09 13:01",
    read: false,
  },
  {
    id: "n2",
    type: "recharge",
    title: "Recharge Approved",
    body: "Your USDT-TRC20 recharge of $5,000.00 has been confirmed and credited to your account.",
    href: "/records/recharge",
    date: "2026-06-09 10:25",
    read: false,
  },
  {
    id: "n3",
    type: "withdraw",
    title: "Withdrawal Processing",
    body: "Your withdrawal request of $3,000.00 is being processed. Estimated arrival: 1–3 business days.",
    href: "/records/withdraw",
    date: "2026-06-08 09:15",
    read: true,
  },
  {
    id: "n4",
    type: "shop",
    title: "Shop Application Received",
    body: "Your shop application has been received and is under review. You will be notified once approved.",
    href: null,
    date: "2026-06-07 14:30",
    read: true,
  },
  {
    id: "n5",
    type: "system",
    title: "Scheduled Maintenance",
    body: "GoMall will undergo scheduled maintenance on Jun 12, 2026 from 02:00–04:00 UTC. Services may be temporarily unavailable.",
    href: null,
    date: "2026-06-07 09:00",
    read: true,
  },
  {
    id: "n6",
    type: "system",
    title: "New Event: First Recharge Bonus",
    body: "Recharge $100 or more and receive a $10 trial credit. Valid through June 30, 2026. Tap to view details.",
    href: "/activity",
    date: "2026-06-05 12:00",
    read: true,
  },
];

export const ORDERS = [
  {
    id: "ord_01J9ZB3K7QF8XA2C4D6E8F0H2M",
    date: "2025-09-02 12:55:14",
    product: PRODUCTS[0],
    total: PRODUCTS[0].amount,
    commission: PRODUCTS[0].commission,
    status: "completed", // completed | pending | frozen
  },
  {
    id: "ord_01J9ZB3K7QF8XA2C4D6E8F0H3N",
    date: "2025-09-02 12:54:38",
    product: PRODUCTS[6],
    total: PRODUCTS[6].amount,
    commission: PRODUCTS[6].commission,
    status: "completed",
  },
];

// Order-status keys; labels resolved via i18n (`orders.<status>`).
export const ORDER_STATUSES = ["all", "pending", "completed", "frozen"];

// Shipping-order status keys; labels resolved via i18n (`shipping.status.<status>`).
export const SHIPPING_STATUSES = ["pending", "processing", "shipped", "delivered", "cancelled"];

// Home quick-action grid; labels resolved via i18n (`home.icon.<key>`).
export const HOME_ICONS = [
  { key: "start", href: "/products", icon: "bag" },
  { key: "register", href: "/kyc", icon: "clipboard" },
  { key: "withdraw", href: "/withdraw", icon: "withdraw" },
  { key: "service", href: "/service", icon: "headset" },
  { key: "terms", href: "/terms", icon: "fileText" },
  { key: "activity", href: "/activity", icon: "gift" },
  { key: "recharge", href: "/recharge", icon: "deposit" },
  { key: "about", href: "/about", icon: "info" },
];

export const BRAND_BANNERS = [
  {
    brand: "GIVENCHY",
    title: "GIVENCHY | 2026 Haute Joaillerie Private Exhibition",
    image: img("1490481651871-ab68de25d43d", 800),
    stars: 5,
  },
  {
    brand: "LOUIS VUITTON",
    title: "LOUIS VUITTON | High Jewelry Spring Collection Preview",
    image: img("1611652022419-a9419f74343d", 800),
    stars: 5,
  },
];

export const RECHARGE_PRESETS = [
  50, 68, 100, 200, 500, 1000, 2000, 3000, 5000, 10000, 20000,
];

export const RECHARGE_REGIONS = [
  { key: "global", label: "🌐 Global" },
  { key: "th",     label: "🇹🇭 Thailand" },
  { key: "vn",     label: "🇻🇳 Vietnam" },
  { key: "my",     label: "🇲🇾 Malaysia" },
  { key: "cn",     label: "🇨🇳 China" },
];

export const PAY_METHODS_BY_REGION = {
  global: [
    { key: "usdt_trc20", name: "USDT-TRC20",   range: "$50 ~ $100,000,000", icon: "coins", type: "usdt" },
    { key: "usdt_erc20", name: "USDT-ERC20",   range: "$50 ~ $100,000,000", icon: "coins", type: "usdt" },
    { key: "bank",       name: "Bank Transfer", range: "$50 ~ $100,000,000", icon: "card",  type: "bank" },
  ],
  th: [
    { key: "promptpay", name: "PromptPay",        range: "฿50 ~ ฿500,000", icon: "qr",     type: "qr"     },
    { key: "truemoney", name: "TrueMoney Wallet", range: "฿50 ~ ฿50,000",  icon: "wallet", type: "ewallet"},
    { key: "kbank",     name: "K-Bank QR",        range: "฿50 ~ ฿500,000", icon: "qr",     type: "qr"     },
  ],
  vn: [
    { key: "momo",    name: "MoMo",     range: "₫50k ~ ₫500M", icon: "wallet", type: "ewallet" },
    { key: "zalopay", name: "ZaloPay",  range: "₫50k ~ ₫500M", icon: "wallet", type: "ewallet" },
    { key: "vnpay",   name: "VNPay QR", range: "₫50k ~ ₫500M", icon: "qr",     type: "qr"      },
  ],
  my: [
    { key: "fpx",     name: "FPX Online Banking",  range: "RM10 ~ RM30,000", icon: "card",   type: "bank"   },
    { key: "tng",     name: "Touch 'n Go eWallet", range: "RM1 ~ RM5,000",   icon: "wallet", type: "ewallet"},
    { key: "maybank", name: "Maybank QRPay",        range: "RM1 ~ RM30,000",  icon: "qr",     type: "qr"     },
  ],
  cn: [
    { key: "alipay", name: "Alipay · 支付宝",  range: "¥50 ~ ¥500,000", icon: "qr", type: "qr" },
    { key: "wechat", name: "WeChat Pay · 微信", range: "¥50 ~ ¥500,000", icon: "qr", type: "qr" },
  ],
};

export const WALLET_TYPES = ["USDT-TRC20", "USDT-ERC20"];

export const RECHARGE_RECORDS = [
  { id: "rcg_01J9ZB3K", date: "2026-06-09 10:25", amount: 5000.00, method: "USDT-TRC20",   status: "completed" },
  { id: "rcg_01J8XC2M", date: "2026-06-07 14:30", amount: 2000.00, method: "Bank Transfer", status: "completed" },
  { id: "rcg_01J7WA1N", date: "2026-06-05 09:15", amount: 1000.00, method: "USDT-ERC20",   status: "reviewing" },
  { id: "rcg_01J6VA0P", date: "2026-06-01 18:45", amount:  500.00, method: "USDT-TRC20",   status: "completed" },
  { id: "rcg_01J5UA9Q", date: "2026-05-25 11:00", amount: 3000.00, method: "Bank Transfer", status: "completed" },
];

export const WITHDRAW_RECORDS = [
  { id: "wd_01J9ZA3K", date: "2026-06-08 09:12", amount: 3000.00, method: "USDT-TRC20", status: "completed" },
  { id: "wd_01J8YB2L", date: "2026-06-05 16:30", amount: 1500.00, method: "USDT-ERC20", status: "reviewing" },
  { id: "wd_01J7XC1M", date: "2026-05-28 11:20", amount:  800.00, method: "USDT-TRC20", status: "completed" },
  { id: "wd_01J6WD0N", date: "2026-05-20 14:05", amount: 2000.00, method: "USDT-TRC20", status: "completed" },
];

export const SHOP_INVENTORY = [
  {
    id: "inv1",
    productId: "p1",
    brand: "Tiffany & Co.",
    title: "18K Gold Heart Diamond Pendant Necklace",
    image: img("1599643478518-a784e5dc4c8f"),
    supply: 2850.0,
    merchantPrice: 3200.0,
    stock: 10,
    listed: true,
  },
  {
    id: "inv2",
    productId: "p7",
    brand: "Hermès",
    title: "Kelly 25 Sellier Epsom Leather · Gold Hardware",
    image: img("1584917865442-de89df76afd3"),
    supply: 21500.0,
    merchantPrice: 23500.0,
    stock: 2,
    listed: true,
  },
  {
    id: "inv3",
    productId: "p3",
    brand: "Cartier",
    title: "Diamond Hoop Earrings · 18K White Gold",
    image: img("1635767798638-3e25273a8236"),
    supply: 1230.0,
    merchantPrice: 1480.0,
    stock: 5,
    listed: false,
  },
];

export const LANGUAGES = [
  { code: "zh", label: "中文简体" },
  { code: "en", label: "English"    },
  { code: "es", label: "Español"    },
  { code: "vi", label: "Tiếng Việt" },
];

// Profile menu; labels resolved via i18n (`profile.menu.<key>`).
// Commission thresholds are cumulative commission earned (USD).
// User.totalCommission=1148.6 → VIP2 in this scale.
export const INVITE_STATS = {
  totalInvited: 12,
  activeUsers: 7,
  bonusEarned: 284.5,
};

export const INVITED_USERS = [
  { id: "u1", account: "***7712", joinedAt: "2026-06-07", active: true,  bonus: 76.0  },
  { id: "u2", account: "***3341", joinedAt: "2026-06-05", active: true,  bonus: 48.5  },
  { id: "u3", account: "***9928", joinedAt: "2026-06-01", active: false, bonus: 0     },
  { id: "u4", account: "***5503", joinedAt: "2026-05-28", active: true,  bonus: 128.0 },
  { id: "u5", account: "***1167", joinedAt: "2026-05-20", active: false, bonus: 0     },
];

export const VIP_LEVELS = [
  {
    level: 1,
    name: "Member",
    rate: 3,
    minCommission: 0,
    color: "text-ivory/70",
    bg: "bg-white/8",
    border: "border-white/15",
    perks: ["Access to full sourcing catalog", "3% commission on every order"],
  },
  {
    level: 2,
    name: "Silver",
    rate: 5,
    minCommission: 500,
    color: "text-gold-300",
    bg: "bg-gold-400/15",
    border: "border-gold-400/40",
    perks: ["Priority product sourcing", "5% commission on every order", "Dedicated chat support"],
  },
  {
    level: 3,
    name: "Gold",
    rate: 8,
    minCommission: 2000,
    color: "text-yellow-400",
    bg: "bg-yellow-400/12",
    border: "border-yellow-400/35",
    perks: ["Exclusive catalog access", "8% commission on every order", "Faster withdrawal processing"],
  },
  {
    level: 4,
    name: "Platinum",
    rate: 12,
    minCommission: 5000,
    color: "text-sky-300",
    bg: "bg-sky-400/12",
    border: "border-sky-400/35",
    perks: ["VIP sourcing deals & flash sales", "12% commission on every order", "Personal account manager"],
  },
  {
    level: 5,
    name: "Diamond",
    rate: 18,
    minCommission: 15000,
    color: "text-violet-300",
    bg: "bg-violet-400/12",
    border: "border-violet-400/35",
    perks: ["Global priority sourcing", "18% commission on every order", "Concierge order processing"],
  },
  {
    level: 6,
    name: "Black Card",
    rate: 25,
    minCommission: 50000,
    color: "text-rose-300",
    bg: "bg-rose-400/12",
    border: "border-rose-400/35",
    perks: ["Elite luxury event invitations", "25% commission on every order", "Lifetime dedicated manager"],
  },
];

export const STATS = {
  today: {
    revenue: 3200, cost: 2850, profit: 350, orders: 1,
    bars:   [0, 0, 0, 0, 3200, 0, 0, 0],
    labels: ["0h","3h","6h","9h","12h","15h","18h","21h"],
  },
  week: {
    revenue: 48600, cost: 42500, profit: 6100, orders: 8,
    bars:   [3200, 8900, 2100, 12400, 4600, 21500, 0],
    labels: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  },
  month: {
    revenue: 124800, cost: 108200, profit: 16600, orders: 24,
    bars:   [5200, 0, 8900, 3200, 12400, 0, 21500, 2600, 4800, 0, 9100, 3200, 18900, 0, 9800],
    labels: ["1","","","","5","","","","9","","","","13","","15"],
  },
  all: {
    revenue: 892400, cost: 768100, profit: 124300, orders: 186,
    bars:   [32400, 48600, 38200, 55800, 42100, 68900, 52400, 71200, 45800, 88300, 76500, 92100],
    labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
  },
};

export const PROFILE_MENU = [
  { key: "cart", href: "/cart", icon: "bag" },
  { key: "shipping", href: "/shipping", icon: "truck" },
  { key: "invite", href: "/invite", icon: "users" },
  { key: "kyc", href: "/kyc", icon: "clipboard" },
  { key: "service", href: "/service", icon: "headset" },
  { key: "withdraw", href: "/withdraw", icon: "withdraw" },
  { key: "recharge", href: "/recharge", icon: "deposit" },
  { key: "history", href: "/records", icon: "receipt" },
  { key: "language", href: "/language", icon: "globe" },
];
