/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090B14',
        surface: {
          DEFAULT: '#141626',
          raised: '#1C1F38',
          card: '#181A2F',
          subtle: '#232742'
        },
        halloween: {
          purple: {
            DEFAULT: '#8B5CF6',
            light: '#A78BFA',
            dark: '#6D28D9',
            glow: 'rgba(139, 92, 246, 0.25)',
          },
          orange: {
            DEFAULT: '#FF7417',
            light: '#FF8F3D',
            dark: '#E05A00',
            glow: 'rgba(255, 116, 23, 0.25)',
          },
          white: '#F8F5F0',
          lavender: '#C4B5FD',
          muted: '#94A3B8',
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
