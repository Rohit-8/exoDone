/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Difficulty color dots and badges
    'bg-emerald-400', 'bg-amber-400', 'bg-orange-400', 'bg-red-400',
    'bg-emerald-500/15', 'bg-amber-500/15', 'bg-orange-500/15', 'bg-red-500/15',
    'text-emerald-400', 'text-amber-400', 'text-orange-400', 'text-red-400',
    'border-emerald-500/30', 'border-amber-500/30', 'border-orange-500/30', 'border-red-500/30',
    // Category colors
    'bg-blue-500/15', 'bg-emerald-500/15', 'bg-purple-500/15',
    'text-blue-400', 'text-emerald-400', 'text-purple-400',
    'hover:border-blue-500/40', 'hover:border-emerald-500/40', 'hover:border-purple-500/40',
    'hover:shadow-blue-500/5', 'hover:shadow-emerald-500/5', 'hover:shadow-purple-500/5',
    'bg-blue-500', 'bg-emerald-500', 'bg-purple-500',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
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
        },
      },
      backdropBlur: {
        '2xl': '40px',
      },
    },
  },
  plugins: [],
}
