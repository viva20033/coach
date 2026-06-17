/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#f4f7fb',
        primary: {
          DEFAULT: '#14b8a6',
          dark: '#0d9488',
          light: '#ccfbf1',
        },
        accent: {
          DEFAULT: '#fbbf24',
          dark: '#f59e0b',
        },
        danger: '#ef4444',
      },
      borderRadius: {
        card: '24px',
        button: '16px',
      },
      boxShadow: {
        card: '0 4px 24px rgba(15, 23, 42, 0.06)',
        soft: '0 2px 12px rgba(15, 23, 42, 0.04)',
      },
      maxWidth: {
        mobile: '480px',
      },
    },
  },
  plugins: [],
}
