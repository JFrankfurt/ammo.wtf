import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        bgCycle: {
          "0%": {
            "--color1": "red",
            "--color2": "green",
            "--color3": "blue",
            "--color4": "cyan",
          },
          "25%": {
            "--color1": "green",
            "--color2": "blue",
            "--color3": "cyan",
            "--color4": "magenta",
          },
          "50%": {
            "--color1": "blue",
            "--color2": "cyan",
            "--color3": "magenta",
            "--color4": "yellow",
          },
          "75%": {
            "--color1": "cyan",
            "--color2": "magenta",
            "--color3": "yellow",
            "--color4": "black",
          },
          "100%": {
            "--color1": "red",
            "--color2": "green",
            "--color3": "blue",
            "--color4": "cyan",
          },
        },
      },
      animation: {
        bgCycle: "bgCycle 30s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
