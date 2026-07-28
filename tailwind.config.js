/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        hud: {
          bg: 'rgb(var(--hud-bg) / <alpha-value>)',
          'bg-soft': 'rgb(var(--hud-bg-soft) / <alpha-value>)',
          panel: 'rgb(var(--hud-panel) / <alpha-value>)',
          border: 'rgb(var(--hud-border) / <alpha-value>)',
          primary: 'rgb(var(--hud-primary) / <alpha-value>)',
          'primary-bright': 'rgb(var(--hud-primary-bright) / <alpha-value>)',
          accent: 'rgb(var(--hud-accent) / <alpha-value>)',
          text: 'rgb(var(--hud-text) / <alpha-value>)',
          'text-dim': 'rgb(var(--hud-text-dim) / <alpha-value>)',
          success: 'rgb(var(--hud-success) / <alpha-value>)',
          warning: 'rgb(var(--hud-warning) / <alpha-value>)',
          error: 'rgb(var(--hud-error) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        glow: '0 0 24px rgba(14, 165, 233, 0.35)',
        'glow-lg': '0 0 48px rgba(14, 165, 233, 0.4)',
        'glow-sm': '0 0 12px rgba(14, 165, 233, 0.25)',
      },
      backdropBlur: {
        xs: '2px',
      },
      keyframes: {
        'fade-in': { from: { opacity: 0 }, to: { opacity: 1 } },
        'scale-in': {
          from: { opacity: 0, transform: 'scale(0.96)' },
          to: { opacity: 1, transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'scale-in': 'scale-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
