/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#080A12',
        surface: {
          DEFAULT: '#15182A',
          secondary: '#101321',
          raised: '#1C1F38',
          card: '#15182A',
          subtle: '#232742'
        },
        halloween: {
          bg: '#080A12',
          bgSecondary: '#101321',
          surface: '#15182A',
          purple: {
            DEFAULT: '#8B5CF6',
            light: '#B79AFF',
            dark: '#6D28D9',
            glow: 'rgba(139, 92, 246, 0.25)',
          },
          orange: {
            DEFAULT: '#FF7417',
            light: '#FF9A24',
            dark: '#E05A00',
            glow: 'rgba(255, 116, 23, 0.25)',
          },
          white: '#F7F4F0',
          lavender: '#B79AFF',
          muted: '#A7ABC0',
          border: '#282B47',
          borderLight: '#383D66',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Cabinet Grotesk', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'glow-purple': '0 0 25px -5px rgba(139, 92, 246, 0.4)',
        'glow-orange': '0 0 25px -5px rgba(255, 116, 23, 0.4)',
        'card': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        }
      }
    },
  },
  plugins: [],
}
