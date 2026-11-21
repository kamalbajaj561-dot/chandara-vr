/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: '#000000',
        darkBlue: '#0a0e27',
        darkerBlue: '#050818',
        gold: '#ffd700',
        goldLight: '#ffed4a',
        goldDark: '#d4af37',
      },
    },
  },
  plugins: [],
}
