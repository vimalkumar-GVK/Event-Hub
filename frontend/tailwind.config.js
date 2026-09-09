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
          800: '#1a1f36',
          900: '#111425',
          950: '#070A14', // requested dark theme background
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#2A9DD4', // requested primary blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        cyan: {
          400: '#22D3EE', // requested cyan glow
        }
      },
      animation: {
        'marquee': 'marquee 25s linear infinite',
      },
      keyframes: {
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        }
      }
    },
  },
  plugins: [],
  darkMode: 'class',
}
