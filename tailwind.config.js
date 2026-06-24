/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}", "./lib/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep champagne gold (tuned for contrast on light surfaces)
        gold: {
          50: "#faf3e0",
          100: "#f3e6c2",
          200: "#e7d099",
          300: "#d8b76a",
          400: "#c79a3c",
          500: "#b0842c",
          600: "#8f6a22",
          700: "#6e511a",
        },
        // Warm charcoal → light cream ink scale (text + neutral surfaces)
        ink: {
          900: "#1c1813",
          800: "#2c2519",
          700: "#46402f",
          600: "#6b6151",
          500: "#8a8070",
          400: "#aaa08d",
          300: "#cabfaa",
          200: "#e7dfce",
          100: "#f2ecdf",
          50: "#faf7f0",
        },
        cream: "#f6f1e7",
        ivory: "#f8f4ea", // light text used on dark hero cards
        muted: "#8a8070",
      },
      fontFamily: {
        serif: ['"Playfair Display"', "Georgia", "Cambria", "serif"],
        sans: ['"Inter"', "-apple-system", "system-ui", "sans-serif"],
      },
      maxWidth: { phone: "440px", app: "1280px" },
      boxShadow: {
        gold: "0 12px 34px -12px rgba(176,132,44,0.5)",
        lux: "0 22px 60px -26px rgba(60,45,20,0.45)",
        card: "0 1px 2px rgba(60,45,20,0.04), 0 12px 30px -16px rgba(60,45,20,0.22)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
