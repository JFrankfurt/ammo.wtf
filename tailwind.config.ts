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

        // Form-specific colors
        form: {
          input: {
            border: "#E7E2D1", // washiBeige
            focus: "#8CA38F", // matchaGreen
            text: "#373532", // sumiBlack
            placeholder: "#857F72", // wabiSabiOlive
            disabled: "#A3A3A2", // ashiStone
          },
          label: "#555555", // kuroganeSteel
          error: "#C94A3D", // akaneRed
        },
      },
      spacing: {
        "form-input-height": "3rem",
        "form-gap": "1.5rem",
        "form-padding": "0.75rem",
      },
      borderRadius: {
        form: "0.375rem",
      },
      boxShadow: {
        form: "0 2px 4px rgba(0, 0, 0, 0.05)",
        "form-focus": "0 0 0 2px rgba(140, 163, 143, 0.2)", // matchaGreen with opacity
      },
      fontSize: {
        "form-label": ["0.875rem", "1.25rem"],
        "form-input": ["1rem", "1.5rem"],
        "form-error": ["0.75rem", "1rem"],
      },
      transitionProperty: {
        form: "border-color, box-shadow, background-color",
      },
      transitionDuration: {
        form: "150ms",
      },
      transitionTimingFunction: {
        form: "cubic-bezier(0.4, 0, 0.2, 1)",
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
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
      animation: {
        bgCycle: "bgCycle 60s ease-in-out infinite",
        fadeIn: "fadeIn 0.3s ease-in-out",
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
