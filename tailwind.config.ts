import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#f07a3a',
      },
      borderRadius: {
        btn: '6px',
        card: '8px',
        container: '12px',
      },
    },
  },
  plugins: [],
};

export default config;
