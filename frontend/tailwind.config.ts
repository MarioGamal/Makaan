import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/pages/**/*.{ts,tsx}', './src/components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sand: '#f3efe6',
        ink: '#1d1a16',
        oasis: '#2d6a6a',
        clay: '#b86b40',
      },
    },
  },
  plugins: [],
};

export default config;

