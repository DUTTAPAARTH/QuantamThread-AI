/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          blue: '#2563eb',
          indigo: '#4f46e5',
          success: '#16a34a',
        },
      },
      boxShadow: {
        soft: '0 1px 3px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
        lift: '0 6px 16px rgba(15, 23, 42, 0.12)',
      },
      borderRadius: {
        xl: '14px',
      },
    },
  },
  plugins: [],
}
