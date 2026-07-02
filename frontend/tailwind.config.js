/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#E8B33D',
          dark: '#BA7517'
        }
      }
    }
  },
  plugins: []
};
