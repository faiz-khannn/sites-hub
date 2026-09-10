/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        base: "#0A0B10",
        surface: "#14151C",
        line: "#23242E",
        ink: "#F5F3EF",
        muted: "#8B8D98",
        ember: "#FF6B4A",
      },
      fontFamily: {
        display: ['"Fraunces"', "serif"],
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
