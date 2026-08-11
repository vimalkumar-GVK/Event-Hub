/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          50: '#f5f7fa',
          100: '#e9ecef',
          200: '#d1d8e0',
          300: '#aeb9c9',
          400: '#8493a8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1a1f36',  // Deep rich violet/navy
          900: '#111425',  // Midnight blue
          950: '#0a0c16',  // Deepest background
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
