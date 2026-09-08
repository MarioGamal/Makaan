import type { Config } from 'tailwindcss';

/**
 * Every colour resolves to a CSS custom property holding sRGB channels, which
 * keeps `bg-primary/10` and `text-ink/70` working while the theme swaps
 * underneath. `theme(...)` values are never hard-coded hexes: a component that
 * hard-codes one stops responding to the dark theme.
 */
const token = (name: string) => `rgb(var(--color-${name}) / <alpha-value>)`;

const config: Config = {
  // The theme is a class on <html>, written before paint by the inline script
  // in _document, so a reload never flashes the wrong theme.
  darkMode: 'class',
  content: ['./src/pages/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'IBM Plex Sans Arabic',
          'Inter Tight',
          'system-ui',
          'sans-serif',
        ],
        display: [
          'IBM Plex Sans Arabic',
          'Inter Tight',
          'system-ui',
          'sans-serif',
        ],
      },
      fontWeight: {
        // IBM Plex Sans Arabic ships 400/500/600: mapping semibold and bold
        // down keeps Arabic from synthesising a heavier face.
        semibold: '500',
        bold: '600',
      },
      colors: {
        canvas: token('canvas'),
        surface: token('surface'),
        'surface-raised': token('surface-raised'),
        'surface-muted': token('surface-muted'),
        'surface-sunken': token('surface-sunken'),
        ink: token('ink'),
        'ink-muted': token('ink-muted'),
        'ink-subtle': token('ink-subtle'),
        'on-ink': token('on-ink'),
        border: token('border'),
        'border-strong': token('border-strong'),
        primary: token('primary'),
        'primary-strong': token('primary-strong'),
        'primary-soft': token('primary-soft'),
        accent: token('accent'),
        'accent-soft': token('accent-soft'),
        danger: token('danger'),
        'danger-soft': token('danger-soft'),
        success: token('success'),
        'success-soft': token('success-soft'),
        warning: token('warning'),
        'warning-soft': token('warning-soft'),
        scrim: token('scrim'),
        // Legacy aliases retained while older routes migrate to the role names.
        sand: token('surface-muted'),
        oasis: token('primary'),
        clay: token('accent'),
      },
      /*
       * Colour roles split by usage. On a light theme `primary` is one green;
       * on a dark theme the readable-on-canvas green (`text-primary`) and the
       * white-bearing filled green (`bg-primary`) cannot be the same value, so
       * the background role points at its own token. This is what lets every
       * existing `bg-primary text-white` stay legible in the dark theme without
       * touching the component.
       */
      backgroundColor: {
        primary: token('primary-surface'),
        'primary-strong': token('primary-strong'),
        accent: token('accent-surface'),
        danger: token('danger-surface'),
        success: token('success-surface'),
        warning: token('warning-surface'),
        ink: token('ink-surface'),
      },
      borderRadius: {
        xs: 'var(--radius-xs)',
        ui: 'var(--radius-sm)',
        panel: 'var(--radius-md)',
        card: 'var(--radius-lg)',
        pill: 'var(--radius-xl)',
        hero: 'var(--radius-hero)',
      },
      boxShadow: {
        xs: 'var(--shadow-xs)',
        ui: 'var(--shadow-sm)',
        panel: 'var(--shadow-md)',
        float: 'var(--shadow-lg)',
        glow: 'var(--shadow-glow)',
      },
      transitionTimingFunction: {
        soft: 'var(--ease-out-soft)',
        spring: 'var(--ease-spring)',
      },
      backgroundImage: {
        'brand-sheen':
          'linear-gradient(135deg, rgb(var(--color-primary-surface)) 0%, rgb(var(--color-primary-strong)) 55%, rgb(var(--color-accent-surface) / 0.85) 160%)',
        'surface-sheen':
          'linear-gradient(180deg, rgb(var(--color-surface-raised)) 0%, rgb(var(--color-surface-muted) / 0.5) 100%)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translate3d(0, 12px, 0)' },
          to: { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 420ms var(--ease-out-soft) both',
        'scale-in': 'scale-in 220ms var(--ease-spring) both',
      },
      spacing: {
        /**
         * The minimum comfortable touch target. The root font size is 15px, so
         * rem-based steps land under 44px (`min-h-11` is 41px); this stays
         * exact regardless of the root size.
         */
        tap: '44px',
      },
      maxWidth: {
        content: '1440px',
        wide: '1580px',
      },
    },
  },
  plugins: [],
};

export default config;
