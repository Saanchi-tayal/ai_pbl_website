/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#F0F7F7',
          100: '#D9ECEE',
          200: '#B6DADE',
          300: '#86BFC6',
          400: '#4D9BA4',
          500: '#1F5E63', // Primary dark teal from specification
          600: '#194E52',
          700: '#153E42',
          800: '#113134',
          900: '#0C2224',
        },
        sage: {
          50: '#F4F7F5',
          100: '#E4ECE7',
          200: '#C9DCD0',
          300: '#ADC9B7',
          400: '#8FAF9A', // Soft sage green from specification
          500: '#73957F',
          600: '#5A7865',
          700: '#445B4D',
          800: '#2E3E34',
        },
        warm: {
          50: '#FAF9F7',
          100: '#F4F3EF',
          200: '#E8E6DF', // Warm off-white from specification
          300: '#D7D4CA',
          400: '#BFBAB0',
        },
        hospital: {
          bg: '#F6F8F7',
          card: '#FFFFFF',
          border: '#E3E8E5',
          textDark: '#1E2929',
          textMuted: '#5C6D6E',
          primary: '#1F5E63',
          accent: '#8FAF9A',
          highlight: '#E8E6DF',
          danger: '#D9534F',
          warning: '#F0AD4E',
          success: '#5CB85C',
          info: '#337AB7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px -1px rgba(31, 94, 99, 0.06), 0 1px 4px -1px rgba(31, 94, 99, 0.04)',
        'card': '0 4px 16px -2px rgba(31, 94, 99, 0.08), 0 2px 6px -1px rgba(31, 94, 99, 0.04)',
        'elevated': '0 12px 28px -4px rgba(31, 94, 99, 0.12), 0 4px 12px -2px rgba(31, 94, 99, 0.06)',
      }
    },
  },
  plugins: [],
}
