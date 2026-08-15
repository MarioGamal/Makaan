import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/pages/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['IBM Plex Sans Arabic', 'Inter Tight', 'Arial', 'sans-serif'],
        display: ['IBM Plex Sans Arabic', 'Inter Tight', 'Arial', 'sans-serif'],
      },
      fontWeight: {
        semibold: '500',
        bold: '600',
      },
      colors: {
        canvas: 'var(--color-canvas)',
        surface: 'var(--color-surface)',
        'surface-raised': 'var(--color-surface-raised)',
        'surface-muted': 'var(--color-surface-muted)',
        ink: 'var(--color-ink)',
        'ink-muted': 'var(--color-ink-muted)',
        border: 'var(--color-border)',
        primary: 'var(--color-primary)',
        'primary-strong': 'var(--color-primary-strong)',
        'primary-soft': 'var(--color-primary-soft)',
        accent: 'var(--color-accent)',
        danger: 'var(--color-danger)',
        success: 'var(--color-success)',
        warning: 'var(--color-warning)',
        // Legacy aliases retained while existing routes migrate to the token names.
        sand: 'var(--color-surface-muted)',
        oasis: 'var(--color-primary)',
        clay: 'var(--color-accent)',
      },
      borderRadius: {
        ui: 'var(--radius-md)',
        panel: 'var(--radius-lg)',
      },
      boxShadow: {
        ui: 'var(--shadow-sm)',
        panel: 'var(--shadow-md)',
      },
    },
  },
  plugins: [],
};

export default config;
