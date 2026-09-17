/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        accent: {
          DEFAULT: '#2F6BFF',
          hover: '#4077FF',
          subtle: 'rgba(47, 107, 255, 0.12)'
        },
        brand: {
          50: '#f0f4ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2F6BFF',
          600: '#2159E6',
          700: '#1A46B8',
          800: '#14358A',
          900: '#0E245C',
          950: '#07122E',
        },
        paper: {
          dark: '#202124',
          darker: '#17181C',
          darkest: '#101114',
          lineDark: '#303238',
          marginDark: 'rgba(239, 68, 68, 0.4)',
          light: '#FFFFFF',
          cream: '#FDFBF7',
          lineLight: '#E2E4E8',
          marginLight: '#E58B8B'
        }
      },
      boxShadow: {
        'paper-dark': '0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.06)',
        'paper-light': '0 20px 40px -15px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.06)',
        'floating': '0 12px 30px -6px rgba(0, 0, 0, 0.35), 0 4px 10px -2px rgba(0, 0, 0, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        handwriting: ['Caveat', 'Patrick Hand', 'cursive'],
        mono: ['Fira Code', 'Courier New', 'monospace']
      }
    },
  },
  plugins: [],
}
