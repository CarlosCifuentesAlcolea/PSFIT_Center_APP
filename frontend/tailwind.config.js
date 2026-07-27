/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D1FB03',
          dark: '#5C6E01'
        }
      }
    }
  },
  plugins: []
};
