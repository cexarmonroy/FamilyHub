import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)"
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)"
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground, oklch(0.985 0 0))"
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)"
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)"
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)"
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)"
        },
        /** Perfiles (Stitch): claves planas para no pisar utilidades core (`outline`, etc.) */
        "fh-surface": "#f7f9fc",
        "fh-on-surface": "#2d3338",
        "fh-on-surface-variant": "#596065",
        "fh-primary": "#2760a4",
        "fh-primary-dim": "#155398",
        "fh-on-primary": "#f8f8ff",
        "fh-primary-container": "#9dc2ff",
        "fh-secondary": "#7049b3",
        "fh-on-secondary": "#fef7ff",
        "fh-secondary-container": "#ebdcff",
        "fh-on-secondary-container": "#623aa5",
        "fh-tertiary": "#a04223",
        "fh-on-tertiary": "#fff7f5",
        "fh-tertiary-container": "#ffa183",
        "fh-on-tertiary-container": "#691b00",
        "fh-surface-container-low": "#f1f4f7",
        "fh-surface-container-lowest": "#ffffff",
        "fh-surface-container-high": "#e3e9ee",
        "fh-surface-container-highest": "#dde3e9",
        "fh-line": "#757c81",
        "fh-line-variant": "#acb3b8",
        "fh-error": "#ac3434"
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        stitch: "1.5rem",
        "stitch-lg": "2rem",
        "stitch-xl": "3rem"
      },
      boxShadow: {
        ambient: "0 8px 24px rgba(45, 51, 56, 0.06)",
        "ambient-soft": "0 8px 24px rgba(45, 51, 56, 0.03)"
      }
    }
  },
  plugins: []
} satisfies Config;
