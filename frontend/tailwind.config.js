/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        campo: {
          50: '#f1f8f2',
          100: '#dcefdf',
          200: '#bbdfc2',
          300: '#8ec79a',
          400: '#5ea86e',
          500: '#3d8b4f',
          600: '#2c703d',
          700: '#245933',
          800: '#1f472b',
          900: '#1a3b25',
          950: '#0c2014',
        },
        terra: {
          50: '#fbf6ef',
          100: '#f5e9d7',
          200: '#ead0ab',
          300: '#dcb077',
          400: '#cf914c',
          500: '#c47a33',
          600: '#a95f28',
          700: '#8c4823',
          800: '#733b23',
          900: '#5f321f',
        },
        sol: {
          300: '#fcd96b',
          400: '#f9c637',
          500: '#e9a90f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
