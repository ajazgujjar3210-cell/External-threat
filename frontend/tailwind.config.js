/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e0f7ff',
          100: '#b3e5ff',
          200: '#80d4ff',
          300: '#4dc2ff',
          400: '#1ab0ff',
          500: '#00C8FF',
          600: '#00B8E6',
          700: '#00A8CC',
          800: '#0098B3',
          900: '#0066FF',
        },
      },
    },
  },
  plugins: [],
}

