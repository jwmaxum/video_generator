/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#08080c',
          900: '#0f1017',
          850: '#151722',
          800: '#1c1f2e',
          700: '#2b3046',
          600: '#404767',
        },
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
          glow: 'rgba(99, 102, 241, 0.25)',
        },
      },
    },
  },
  plugins: [],
};
