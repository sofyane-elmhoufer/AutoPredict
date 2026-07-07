/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef7f2",
          100: "#d3ebde",
          500: "#1f7a4d",
          600: "#186339",
          700: "#124a2b",
        },
      },
    },
  },
  plugins: [],
};
