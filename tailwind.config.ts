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
        // Core Hacker Theme
        background: "#0D0D0D", // Near black background
        foreground: "#E0E0E0", // Light gray for primary text
        muted: "#555555", // Darker gray for secondary text/elements
        accentGreen: "#00FF00", // Bright, classic terminal green
        accentRed: "#FF0000", // Bright red for errors/warnings
        accentBlue: "#00BFFF", // A secondary accent color (deep sky blue)

        // UI Element Specifics
        primary: {
          DEFAULT: "#00FF00", // Green for primary buttons/actions
          foreground: "#0D0D0D", // Black text on green buttons
        },
        secondary: {
          DEFAULT: "#555555", // Muted gray for secondary actions
          foreground: "#E0E0E0", // Light gray text on muted buttons
        },
        destructive: {
          DEFAULT: "#FF0000", // Red for destructive actions
          foreground: "#E0E0E0", // Light gray text on red buttons
        },
        border: "#333333", // Subtle border color
        input: "#222222", // Dark input background
        ring: "#00FF00", // Green focus ring

        // Specific use case colors from original theme (re-mapped or kept if generic)
        // These might need further refinement based on usage.
        kumoGray: "#555555", // Re-mapped to muted
        shiroWhite: "#E0E0E0", // Re-mapped to foreground
        washiBeige: "#333333", // Re-mapped to border or similar dark neutral
        hinokiWood: "#444444", // Dark neutral
        kansoClay: "#663333", // Dark reddish-brown, less prominent
        ashiStone: "#404040", // Dark gray
        matchaGreen: "#00FF00", // Re-mapped to accentGreen
        koiOrange: "#FF8C00", // Dark Orange, could be another accent if needed
        wabiSabiOlive: "#3A3A3A", // Very dark neutral
        sumiBlack: "#0D0D0D", // Re-mapped to background
        kuroganeSteel: "#555555", // Re-mapped to muted
        akaneRed: "#FF0000", // Re-mapped to accentRed

        // Form-specific colors mapped to the new theme
        form: {
          input: {
            border: "#333333", // border
            focus: "#00FF00", // accentGreen (used for ring usually)
            text: "#E0E0E0", // foreground
            placeholder: "#555555", // muted
            disabled: "#404040", // ashiStone (dark gray)
            background: "#222222", // input background
          },
          label: "#555555", // Changed from #AAAAAA
          error: "#FF0000", // accentRed
        },
      },
      spacing: {
        "form-input-height": "2.5rem", // Slightly shorter input height
        "form-gap": "1rem", // Slightly smaller gap
        "form-padding": "0.5rem 0.75rem", // Adjust padding
      },
      borderRadius: {
        DEFAULT: "0px",
        sm: "0px",
        md: "2px", // Minimal rounding for some elements if needed
        lg: "4px",
        full: "9999px", // Keep for avatars etc.
        form: "2px", // Minimal rounding for form elements
      },
      boxShadow: {
        none: "none",
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        inner: "none",
        outline: "none",
        "form-focus": "0 0 0 2px #00FF00", // accentGreen focus ring
      },
      transitionProperty: {
        colors: "background-color, border-color, color, fill, stroke, opacity",
        form: "border-color, box-shadow, background-color",
      },
      transitionDuration: {
        DEFAULT: "100ms",
        form: "100ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.4, 0, 0.2, 1)",
        form: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        // Add blink animation for cursor
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        // Add glitch effect animation
        glitch: {
          '0%': {
            transform: 'translate(0)',
            textShadow: '1px 1px 0px #FF0000, -1px -1px 0px #00BFFF' // Use accentRed and accentBlue
          },
          '5%': {
            transform: 'translate(-2px, 1px)',
            textShadow: '1px 1px 0px #00FF00, -1px -1px 0px #FF0000' // Use accentGreen and accentRed
          },
          '10%': {
            transform: 'translate(2px, -1px)',
            textShadow: '-1px 1px 0px #00BFFF, 1px -1px 0px #00FF00' // Use accentBlue and accentGreen
          },
          '15%': {
            transform: 'translate(0)',
            textShadow: '1px 1px 0px #FF0000, -1px -1px 0px #00BFFF'
          },
          // Add more steps for a more chaotic effect
          '100%': {
            transform: 'translate(0)',
            textShadow: 'none' // End clean briefly
          }
        },
        // Add subtle screen flicker
        flicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.95' },
          '51%': { opacity: '1' },
          '75%': { opacity: '0.98' },
          '76%': { opacity: '1' },
        }
      },
      animation: {
        fadeIn: "fadeIn 0.2s ease-in-out",
        // Add blink animation utility
        blink: 'blink 1s step-end infinite',
        // Add glitch animation utility (apply this sparingly)
        glitch: 'glitch 0.5s linear infinite',
        // Add flicker animation utility for the container
        flicker: 'flicker 1.5s infinite'
      },
      fontFamily: {
        mono: [
          "ui-monospace",
          "'Cascadia Code'",
          "'Source Code Pro'",
          "Menlo",
          "Consolas",
          "'DejaVu Sans Mono'",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
