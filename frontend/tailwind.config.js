/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Ancien nom de couleur, encore utilisé par le back-office admin (primary = ink)
        primary: {
          50: "#F1F3F8",
          100: "#DCE1EC",
          500: "#3C4B70",
          600: "#1D2A4A",
          700: "#14213D",
        },
        // Encre : texte et structure
        ink: {
          50: "#F1F3F8",
          100: "#DCE1EC",
          300: "#8593B3",
          500: "#3C4B70",
          700: "#1D2A4A",
          800: "#14213D",
          900: "#0B1226",
        },
        // Papier : fonds clairs, légèrement gris
        paper: {
          DEFAULT: "#EEF0EA",
          raised: "#F8F9F5",
        },
        // Rouge des petits taxis de Casablanca : boutons et accents
        taxi: {
          50: "#FBEAE8",
          400: "#D3453F",
          500: "#C1272D",
          600: "#9E1F24",
          700: "#7A171B",
        },
        // Ocre : accent secondaire (utilisé pour le cache)
        ochre: {
          50: "#FBF3E3",
          400: "#E3B65C",
          500: "#D9A441",
          600: "#B8862E",
        },
        // Vert-bleu : succès
        teal: {
          50: "#EAF3F1",
          400: "#4C8C7D",
          500: "#2F6F62",
          600: "#235349",
        },
        asphalt: {
          50: "#F3F4F2",
          200: "#D8DBD4",
          400: "#8D9289",
          600: "#5C615A",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        sans: ["'Inter'", "system-ui", "sans-serif"],
        plate: ["'IBM Plex Mono'", "monospace"],
      },
      borderRadius: {
        plate: "10px",
      },
      boxShadow: {
        plate: "0 1px 0 rgba(255,255,255,0.6) inset, 0 10px 30px -12px rgba(11,18,38,0.35)",
        card: "0 1px 2px rgba(11,18,38,0.04), 0 8px 24px -12px rgba(11,18,38,0.12)",
      },
    },
  },
  plugins: [],
};
