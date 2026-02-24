import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: 'hsl(var(--card))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: 'hsl(var(--primary))',
        accent: 'hsl(var(--accent))',
        border: 'hsl(var(--border))'
      },
      borderRadius: {
        xl: '1rem'
      },
      boxShadow: {
        soft: '0 12px 30px -12px rgb(15 23 42 / 0.2)'
      }
    }
  },
  plugins: []
};

export default config;
