/**@type {import("tailwindcss").Config} */
module.exports = {
  darkMode: ["variant", [".dark &", '[data-kb-theme="dark"] &']],
  content: ["./src/**/*.{ts,tsx}"],
  plugins: [require("tailwindcss-animate")],
};
