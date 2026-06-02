import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Surfaces (The Layering Stack) ──────────────────────
        background:                '#f6f6fb',
        surface:                   '#f6f6fb',
        'surface-container-low':   '#f0f0f6',
        'surface-container':       '#e7e8ee',
        'surface-container-high':  '#dbdde3',
        'surface-container-highest':'#dbdde3',
        'surface-container-lowest':'#ffffff',

        // ── On-Surface Text ────────────────────────────────────
        'on-surface':              '#2d2f33',
        'on-surface-variant':      '#5a5b60',

        // ── Brand — Secondary (Purple) ─────────────────────────
        secondary:                 '#4c49c9',
        'on-secondary':            '#ffffff',
        'secondary-container':     '#e4e3ff',
        'secondary-fixed':         '#cfcdff',

        // ── Brand — Tertiary (Sunset Orange) ───────────────────
        tertiary:                  '#ff9817',
        'tertiary-container':      '#ff9817',
        'tertiary-fixed':          '#ff9817',
        'on-tertiary':             '#ffffff',

        // ── Utility ────────────────────────────────────────────
        'outline-variant':         '#acadb1',
        error:                     '#ba1a1a',
        'on-error':                '#ffffff',
        success:                   '#1a6b3a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem',   { lineHeight: '1.1',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.5rem',   { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-sm': ['1.75rem',  { lineHeight: '1.2',  letterSpacing: '-0.02em', fontWeight: '700' }],
        'headline-lg':['1.5rem',   { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-md':['1.25rem',  { lineHeight: '1.3',  letterSpacing: '-0.01em', fontWeight: '600' }],
        'headline-sm':['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.01em', fontWeight: '600' }],
        'body-lg':    ['1rem',     { lineHeight: '1.6',  fontWeight: '400' }],
        'body-md':    ['0.875rem', { lineHeight: '1.6',  fontWeight: '400' }],
        'label-lg':   ['0.875rem', { lineHeight: '1.4',  fontWeight: '500' }],
        'label-md':   ['0.75rem',  { lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.02em' }],
        'label-sm':   ['0.6875rem',{ lineHeight: '1.4',  fontWeight: '500', letterSpacing: '0.04em' }],
      },
      borderRadius: {
        sm:   '0.25rem',
        md:   '0.75rem',
        lg:   '1rem',
        xl:   '1.5rem',
        '2xl':'2rem',
        full: '9999px',
      },
      boxShadow: {
        // Ambient shadow tinted with secondary purple at 4%
        card:    '0 10px 40px 0 rgba(76, 73, 201, 0.04)',
        float:   '0 10px 40px 0 rgba(76, 73, 201, 0.08)',
        'ghost':  '0 0 0 1px rgba(172, 173, 177, 0.15)',
      },
      backgroundImage: {
        // Sunset gradient: secondary → tertiary
        'sunset':         'linear-gradient(135deg, #4c49c9 0%, #ff9817 100%)',
        'sunset-reverse': 'linear-gradient(135deg, #ff9817 0%, #4c49c9 100%)',
        'sunset-vertical':'linear-gradient(180deg, #4c49c9 0%, #ff9817 100%)',
        // Chart bars gradient
        'bar-gradient':   'linear-gradient(180deg, #7c7ae8 0%, #ff9817 100%)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'shimmer': { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'shimmer': 'shimmer 2s infinite linear',
      },
    },
  },
  plugins: [],
}

export default config
