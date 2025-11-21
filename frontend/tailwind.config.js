/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'], // Enables dark mode toggle via data-theme attr
  theme: {
    extend: {
      colors: {
        // Base backgrounds
        "bg-main": {
          DEFAULT: "#d6f4ff", // pastel-green-light
          dark: "#1a202c", // dark-bg
        },
        "bg-header": {
          DEFAULT: "#ffffff", // white
          dark: "#2d3748", // dark-surface
        },
        "bg-sidebar": {
          DEFAULT: "#1059b9", // pastel-green-dark
          dark: "#1f2937", // gray-800
        },
        "bg-card": {
          DEFAULT: "#ffffff", // white
          dark: "#2d3748", // dark-surface
        },

        // Text colors
        "text-main": {
          DEFAULT: "#1f2937", // gray-800
          dark: "#e2e8f0", // dark-text
        },
        "text-secondary": {
          DEFAULT: "#6b7280", // gray-500
          dark: "#9ca3af", // gray-400
        },
        "text-hover": {
          DEFAULT: "#374151", // gray-700
          dark: "#d1d5db", // gray-300
        },

        // Borders and accents
        border: {
          DEFAULT: "#e5e7eb", // gray-200
          dark: "#4b5563", // gray-600
        },
        accent: "#a7d7c5", // pastel-green

        // Utility colors (optional)
        primary: "#1059b9",
        "primary-dark": "#1059b9",
        secondary: "#e5e7eb",
        "secondary-dark": "#d1d5db",
      },
    },
  },
  plugins: [],
};
