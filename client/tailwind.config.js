/** @type {import('tailwindcss').Config} */


export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      borderRadius: { '2xl': '16px', '3xl': '20px' },
      boxShadow: { 
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        glow: '0 0 40px rgba(34, 211, 238, 0.3)'
      },
      colors: {
        cyan: { 500: '#06b6d4', 400: '#22d3ee' },
        purple: { 500: '#8b5cf6', 600: '#7c3aed' }
      }
    },
  },
}