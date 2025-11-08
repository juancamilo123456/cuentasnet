/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
        ink: {
          900: '#0B0E14',
          800: '#0f1320',
          700: '#121726',
        },
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6d28d9',   // violeta
          600: '#5b21b6',
          700: '#4c1d95',
        },
        accent: {
          400: '#22d3ee',   // cyan
          500: '#06b6d4',
          600: '#0891b2',
        },
        mint: {
          400: '#34d399',
        },
        warn: {
          500: '#f87171',
        }
      },
      boxShadow: {
        card: '0 12px 40px rgba(0,0,0,.35)',
        glow: '0 0 0 1px rgba(255,255,255,.06), 0 12px 30px rgba(0,0,0,.35)'
      },
      borderRadius: {
        '2.5xl': '1.25rem'
      }
    },
  },
  plugins: [],
}
