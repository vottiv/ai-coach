/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Базовая нейтральная поверхность (тёмная тема по умолчанию)
        bg: "hsl(240 6% 7%)",
        surface: "hsl(240 5% 11%)",
        border: "hsl(240 4% 18%)",
        muted: "hsl(240 4% 64%)",
        // Цвета модулей (ТЗ п. 4.2)
        workouts: "#F97316", // Тренировки — оранжевый
        nutrition: "#22C55E", // Питание — зелёный
        health: "#3B82F6", // Анализы — синий
        feelings: "#8B5CF6", // Ощущения — фиолетовый
      },
      borderRadius: {
        "2xl": "1rem",
      },
    },
  },
  plugins: [],
};
