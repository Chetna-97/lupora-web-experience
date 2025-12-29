/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Playfair Display"', 'serif'], // For that Mont-Fort luxury look
      },
      colors: {
        gold: '#C5A059',
      }
    },
  },
  plugins: [],
}