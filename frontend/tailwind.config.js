/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cinematic: {
          light: '#65E4CF',
          dark: '#056363',
          bgLight: '#e4e4e7',
          bgDark: '#09090b',
        }
      },
      fontFamily: {
        cinematic: ['Inter', 'sans-serif'], // Assuming Inter for now, can be updated to Outfit/Helvetica
      }
    },
  },
  plugins: [],
}

