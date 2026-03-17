import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        surface:    "var(--surface)",

        // ── Brand palette (exact from style guide) ──────────────
        blue: {
          DEFAULT: "#4A7FF8",
          50:  "#EEF3FE",
          100: "#D6E4FD",
          200: "#AECAFB",
          300: "#85AEF9",
          400: "#5D93F8",
          500: "#4A7FF8",   // primary
          600: "#2E63E0",
          700: "#1E4BBF",
          800: "#14369A",   // ~the indigo card bg
          900: "#0D2370",
          // dark navy from the blue scale strip
          dark: "#1A2E6B",
        },
        orange: {
          DEFAULT: "#FF7648",
          light:   "#FFE8DF",
        },
        yellow: {
          DEFAULT: "#FFC757",
          light:   "#FFF3D6",
        },
        // Neutral warm grays
        warm: {
          50:  "#FAFAF8",
          100: "#F5F4F0",
          200: "#F0EFEB",   // main app bg
          300: "#E8E6DF",
          400: "#D4D0C6",
          500: "#B0A898",
          600: "#857C6C",
          700: "#58513F",
          800: "#35302A",
          900: "#202020",   // text / near-black
        },
      },

      fontFamily: {
        // Roobert is the brand font. Falls back to DM Sans (closest free alternative).
        sans: [
          "Roobert",
          "var(--font-dm-sans)",
          "DM Sans",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["var(--font-geist-mono)", "monospace"],
      },

      fontSize: {
        "2xs": ["10px", { lineHeight: "1.4", letterSpacing: "0.06em" }],
        xs:   ["12px", { lineHeight: "1.4", letterSpacing: "0.02em" }],
        sm:   ["14px", { lineHeight: "1.5" }],
        base: ["16px", { lineHeight: "1.5" }],
        lg:   ["18px", { lineHeight: "1.45" }],
        xl:   ["20px", { lineHeight: "1.4" }],
        "2xl":["24px", { lineHeight: "1.35" }],
        "3xl":["30px", { lineHeight: "1.25", letterSpacing: "-0.01em" }],
        "4xl":["36px", { lineHeight: "1.2",  letterSpacing: "-0.015em" }],
        "5xl":["44px", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "6xl":["56px", { lineHeight: "1.1",  letterSpacing: "-0.025em" }],
      },

      borderRadius: {
        sm:    "8px",
        DEFAULT:"12px",
        md:    "16px",
        lg:    "20px",
        xl:    "24px",
        "2xl": "28px",
        "3xl": "32px",
        full:  "9999px",
      },

      boxShadow: {
        xs:      "0 1px 3px rgba(0,0,0,0.05)",
        sm:      "0 2px 8px rgba(0,0,0,0.07)",
        DEFAULT: "0 4px 16px rgba(0,0,0,0.08)",
        md:      "0 8px 24px rgba(0,0,0,0.09)",
        lg:      "0 16px 40px rgba(0,0,0,0.11)",
        card:    "0 2px 12px rgba(0,0,0,0.06)",
      },

      backgroundImage: {
        // Warm aurora gradient (orange→yellow, seen on logo card + home screen)
        "aurora-warm":
          "radial-gradient(ellipse at 20% 80%, #FF7648 0%, #FFC757 60%, #FFE8A0 100%)",
        // Blue→purple→orange full aurora (seen on onboarding screen bg)
        "aurora-full":
          "radial-gradient(ellipse at 30% 70%, #4A7FF8 0%, #9B6DD8 30%, #E05454 55%, #FF7648 75%, #FFC757 100%)",
        // Subtle tint for section backgrounds
        "aurora-subtle":
          "radial-gradient(ellipse at 20% 85%, rgba(74,127,248,0.25) 0%, rgba(155,109,216,0.18) 35%, rgba(255,118,72,0.15) 65%, rgba(255,199,87,0.10) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
