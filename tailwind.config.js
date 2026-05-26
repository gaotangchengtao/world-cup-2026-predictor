/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: {
          50: "#eefcf5",
          100: "#d6f8e8",
          500: "#16a36c",
          700: "#087348",
          950: "#05251c",
        },
        trophy: {
          300: "#f8da84",
          500: "#e4ad28",
          700: "#a66f12",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(228, 173, 40, 0.18)",
      },
    },
  },
  plugins: [],
};
