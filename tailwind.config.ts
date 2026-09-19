import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink:    "#0B0E13",   // background
        panel:  "#0F141B",
        line:   "#1E2631",
        bone:   "#F1F1F4",   // primary text
        ash:    "#999B9C",   // secondary
        slate:  "#616264",   // tertiary
        mint:   "#A7DFDA",   // AARVAK house
        lav:    "#A49AEA",   // AARVAK house, interface chrome
        nexus:  "#4C8DFF",
        echo:   "#D8DEE6",
        ascend: "#D4342B",
        byte:   "#57D94A",
        cipher: "#E8A33C",
      },
      fontFamily: {
        display: ["'Saira Condensed'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
