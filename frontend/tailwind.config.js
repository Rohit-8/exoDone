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
    'bg-blue-500/10', 'bg-emerald-500/10', 'bg-violet-500/10',
    'text-blue-400', 'text-emerald-400', 'text-violet-400',
    'hover:border-blue-500/30', 'hover:border-emerald-500/30', 'hover:border-violet-500/30',
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0e0e13',
          50: '#f7f7f8',
          100: '#ededee',
          200: '#d9d9dc',
          300: '#b4b4ba',
          400: '#8e8e97',
          500: '#6e6e78',
          600: '#535360',
          700: '#383844',
          800: '#23232c',
          900: '#181820',
          950: '#0e0e13',
        },
        accent: {
          DEFAULT: '#7c5cfc',
          50: '#f3f0ff',
          100: '#e9e2ff',
          200: '#d5c8ff',
          300: '#b8a0ff',
          400: '#9b7dff',
          500: '#7c5cfc',
          600: '#6b3ff2',
          700: '#5c2fd6',
          800: '#4c27b3',
          900: '#402292',
          950: '#251363',
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
