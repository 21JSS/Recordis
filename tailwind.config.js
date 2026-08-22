/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Primary accent used across the app (e.g., FAB, icons)
        primary: "#A78BFA",
        // Additional semantic colors – can be accessed via `bg-background`, `bg-backgroundElement`, etc.
        background: "#ffffff",
        "background-dark": "#000000",
        backgroundElement: "#F0F0F3",
        "backgroundElement-dark": "#212225",
        backgroundSelected: "#E0E1E6",
        "backgroundSelected-dark": "#2E3135",
        text: "#000000",
        "text-dark": "#ffffff",
        textSecondary: "#60646C",
        "textSecondary-dark": "#B0B4BA",
      },
      spacing: {
        "0": "0px",
        "0.5": "2px",
        "1": "4px",
        "2": "8px",
        "3": "16px",
        "4": "24px",
        "5": "32px",
        "6": "64px",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
        serif: ["ui-serif", "serif"],
        mono: ["ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
}