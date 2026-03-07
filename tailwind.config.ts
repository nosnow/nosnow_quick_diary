import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#13223a",
        paper: "#f6f4ee",
        accent: "#cc5a2f",
        moss: "#4f7d45"
      }
    }
  },
  plugins: []
};

export default config;
