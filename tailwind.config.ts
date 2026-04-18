import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0b0d10",
          raised: "#15181d",
          elevated: "#1c2028",
          border: "#262b35",
        },
        tier: {
          iron: "#574d45",
          bronze: "#8c6239",
          silver: "#9aa3ab",
          gold: "#dcb94b",
          platinum: "#4ec2b0",
          emerald: "#2fbf71",
          diamond: "#5b8cf3",
          master: "#c47bff",
          grandmaster: "#ff5d5d",
          challenger: "#f3e07a",
        },
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
        display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 40px -10px rgba(196, 123, 255, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
