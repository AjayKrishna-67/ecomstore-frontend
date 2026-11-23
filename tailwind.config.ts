import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  plugins: [require('@tailwindcss/forms')],

  theme: {
    extend: {
      screens: {
        mob: '425px',
        md: '768px',
      },
      colors: {
        // ─── Semantic theme tokens (CSS variable-based) ───
        background: 'var(--bg-page)',
        foreground: 'var(--text-primary)',
        surface: {
          DEFAULT: 'var(--bg-surface)',
          hover: 'var(--bg-surface-hover)',
        },
        'header-bg': 'var(--bg-header)',
        'header-text': 'var(--text-header)',
        'header-accent': 'var(--text-header-accent)',
        'footer-text': 'var(--text-footer)',
        'footer-accent': 'var(--text-footer-accent)',
        'btn-primary': {
          DEFAULT: 'var(--bg-btn-primary)',
          hover: 'var(--bg-btn-primary-hover)',
          text: 'var(--text-btn-primary)',
        },
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-muted': 'var(--text-muted)',
        'border-theme': 'var(--border-default)',
        'border-strong': 'var(--border-strong)',
        'input-bg': 'var(--bg-input)',
        'input-border': 'var(--border-input)',
        accent: {
          DEFAULT: 'var(--color-accent)',
        },
        // Legacy tokens (backwards compat)
        'card-bg': 'var(--bg-surface)',
        'card-foreground': 'var(--text-primary)',
        'muted': 'var(--bg-surface-hover)',
        'muted-foreground': 'var(--text-tertiary)',
        'border-color': 'var(--border-default)',

        // ─── SWAD KERALA Brand Colors (direct access) ───
        'navy': {
          DEFAULT: '#1E3A5F',
          dark: '#0F172A',
          light: '#2D4A6B',
          50: '#E8EDF3',
          100: '#D1DBE7',
          200: '#A3B7CF',
          300: '#7593B7',
          400: '#476F9F',
          500: '#1E3A5F',
          600: '#182E4C',
          700: '#122239',
          800: '#0C1626',
          900: '#060B13',
        },
        'spice': {
          DEFAULT: '#CD7F32',
          gold: '#D4AF37',
          light: '#E8C28A',
          50: '#FAF5EB',
          100: '#F5EBD7',
          200: '#EBD7AF',
          300: '#E1C387',
          400: '#D7AF5F',
          500: '#CD7F32',
          600: '#A36628',
          700: '#7A4D1E',
          800: '#523314',
          900: '#291A0A',
        },
        'gold': {
          DEFAULT: '#D4AF37',
          light: '#E8C28A',
          dark: '#B8860B',
        },
        'cream': {
          DEFAULT: '#FFFEF0',
          light: '#FAF3E0',
          background: '#FFFEF8',
        },
        'primary': {
          DEFAULT: '#1E3A5F',
          50: '#E8EDF3',
          100: '#D1DBE7',
          200: '#A3B7CF',
          300: '#7593B7',
          400: '#476F9F',
          500: '#1E3A5F',
          600: '#182E4C',
          700: '#122239',
          800: '#0C1626',
          900: '#060B13',
        },
      },
      animation: {
        dropIn: 'dropIn 0.2s ease-out',
        marquee: 'marquee 20s linear infinite',
      },
      keyframes: {
        dropIn: {
          '0%': { transform: 'translateY(-100px)' },
          '100%': { transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
      },
    },
  },
} satisfies Config;
