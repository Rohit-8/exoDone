/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Difficulty color dots and badges
    'bg-emerald-400', 'bg-amber-400', 'bg-orange-400', 'bg-red-400',
    'bg-emerald-500/10', 'bg-amber-500/10', 'bg-orange-500/10', 'bg-red-500/10',
    'text-emerald-400', 'text-amber-400', 'text-orange-400', 'text-red-400',
    'border-emerald-500/20', 'border-amber-500/20', 'border-orange-500/20', 'border-red-500/20',
    // Category colors
    'bg-blue-500/10', 'bg-emerald-500/10', 'bg-sky-500/10',
    'text-blue-400', 'text-emerald-400', 'text-sky-400',
    'hover:border-blue-500/30', 'hover:border-emerald-500/30', 'hover:border-sky-500/30',
    'bg-blue-500', 'bg-emerald-500', 'bg-sky-500',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#131620',
          50: '#f7f8f9',
          100: '#eceef1',
          200: '#d8dbe0',
          300: '#b5bac4',
          400: '#8d95a3',
          500: '#6e7787',
          600: '#545d6e',
          700: '#3a4255',
          800: '#262d3c',
          900: '#1a1f2c',
          950: '#131620',
        },
        accent: {
          DEFAULT: '#3b82f6',
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
