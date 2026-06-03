/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      borderRadius: {
        'DEFAULT': '0.25rem',
        'sm': '0.25rem',
        'md': '0.5rem',
        'lg': '0.75rem',
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
        'full': '9999px'
      },
      boxShadow: { 
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.5)',
        glow: '0 0 15px rgba(0, 212, 255, 0.4)',
        'glow-primary': '0 0 15px rgba(124, 58, 237, 0.4)',
        'glow-tertiary': '0 0 15px rgba(255, 185, 95, 0.4)',
        'glow-error': '0 0 15px rgba(255, 180, 171, 0.4)',
        'glow-success': '0 0 15px rgba(3, 198, 178, 0.4)'
      },
      colors: {
        primary: '#d2bbff',
        'primary-container': '#7c3aed',
        'on-primary-container': '#ede0ff',
        secondary: '#00d4ff', // Cyan
        'secondary-container': '#03c6b2',
        'on-secondary-container': '#004d44',
        tertiary: '#ffb95f', // Amber
        'tertiary-container': '#905b00',
        'tertiary-fixed': '#ffddb8',
        'tertiary-fixed-dim': '#ffb95f',
        surface: '#0b1326',
        'surface-dim': '#0b1326',
        'surface-bright': '#31394d',
        'surface-container-lowest': '#060e20',
        'surface-container-low': '#131b2e',
        'surface-container': '#171f33',
        'surface-container-high': '#222a3d',
        'surface-container-highest': '#2d3449',
        background: '#0b1326',
        'on-background': '#dae2fd',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#ccc3d8',
        outline: '#958da1',
        'outline-variant': '#4a4455',
        error: '#ffb4ab',
        'error-container': '#93000a',
        'on-error': '#690005',
        'on-error-container': '#ffdad6',
        // Compatibility fallbacks
        cyan: { 500: '#06b6d4', 400: '#22d3ee' },
        purple: { 500: '#8b5cf6', 600: '#7c3aed' }
      },
      spacing: {
        base: '4px',
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '32px',
        xl: '48px',
        gutter: '20px',
        'margin-page': '32px',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Geist', 'monospace'],
        display: ['Inter', 'sans-serif'],
        label: ['Geist', 'sans-serif'],
      }
    },
  },
}