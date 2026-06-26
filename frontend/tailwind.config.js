/** Sistema de diseño propio de StudyTrack (no usa preset de librerías de componentes). */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Fondo "papel" cálido en lugar del blanco puro genérico
        paper: "#FAF7F2",
        surface: "#FFFFFF",
        ink: "#21251F", // texto principal, negro tibio
        muted: "#6F6A63", // texto secundario
        line: "#E7E1D8", // bordes suaves
        // Verde salvia profundo: identidad de "estudio / foco"
        primary: {
          DEFAULT: "#2F6F5E",
          soft: "#E6F0EC",
          dark: "#245446",
        },
        // Terracota: acento humano y cálido para hábitos / energía
        accent: {
          DEFAULT: "#C56B4A",
          soft: "#F6E7DF",
        },
        danger: "#B4453A",
      },
      fontFamily: {
        // Serif expresiva para títulos (personalidad, look editorial humano)
        display: ["Fraunces", "Georgia", "serif"],
        // Sans humanista para cuerpo (legible, cálida)
        sans: ["Figtree", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(33,37,31,0.04), 0 8px 24px rgba(33,37,31,0.06)",
      },
    },
  },
  plugins: [],
};
