import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class"],
  safelist: ["dark"],
  theme: {
    extend: {
      colors: {
        // Neutral Base
        kumoGray: "#D9D9D9",
        shiroWhite: "#F9F8F6",
        washiBeige: "#E7E2D1",

        // Earthy Tones
        hinokiWood: "#B59B7C",
        kansoClay: "#C97D61",
        ashiStone: "#A3A3A2",

        // Organic Accents
        matchaGreen: "#8CA38F",
        koiOrange: "#DB8C5C",
        wabiSabiOlive: "#857F72",

        // Dark Contrasts
        sumiBlack: "#373532",
        kuroganeSteel: "#555555",

        // Red for Vitality
        akaneRed: "#C94A3D",
      },
      keyframes: {
        bgCycle: {
          "0%": { backgroundColor: "#D9D9D9" }, // kumoGray
          "20%": { backgroundColor: "#E7E2D1" }, // washiBeige
          "40%": { backgroundColor: "#B59B7C" }, // hinokiWood
          "60%": { backgroundColor: "#8CA38F" }, // matchaGreen
          "80%": { backgroundColor: "#DB8C5C" }, // koiOrange
          "100%": { backgroundColor: "#D9D9D9" }, // loop back to kumoGray
        },
      },
      animation: {
        bgCycle: "bgCycle 60s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [],
};
export default config;
