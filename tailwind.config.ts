import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "Arial",
          "Noto Sans",
          "Liberation Sans",
          "sans-serif"
        ],
        display: [
          "ui-rounded",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Inter",
          "Arial",
          "Noto Sans",
          "Liberation Sans",
          "sans-serif"
        ]
      }
    }
  },
  plugins: []
} satisfies Config;
