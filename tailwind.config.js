/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#eefaf5",
          100: "#d3f2e4",
          500: "#00875a",
          700: "#006847",
          950: "#003d2a",
        },
        trophy: {
          50: "#fff1f3",
          100: "#ffe0e4",
          200: "#ffb8c1",
          300: "#ff8291",
          400: "#ef4054",
          500: "#d80621",
          700: "#9f1025",
          800: "#7d1222",
        },
        host: {
          navy: "#002868",
          blue: "#0b4ea2",
          red: "#bf0a30",
          maple: "#d80621",
          green: "#006847",
          ice: "#f4f8ff",
        },
      },
      boxShadow: {
        glow: "0 0 36px rgba(216, 6, 33, 0.2)",
      },
    },
  },
  plugins: [],
};
