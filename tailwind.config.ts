import type { Config } from 'tailwindcss'

export default {
  content: [
    './src/components/**/*.{js,vue,ts}',
    './src/layouts/**/*.vue',
    './src/pages/**/*.vue',
    './src/plugins/**/*.{js,ts}',
    './src/app.vue',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Noto Sans JP"', '"Hiragino Sans"', 'system-ui', 'sans-serif'],
        inter: ['Inter', '"Noto Sans JP"', 'sans-serif'],
      },
      colors: {
        brand: {
          25:  'var(--color-brand-25)',
          50:  'var(--color-brand-50)',
          100: 'var(--color-brand-100)',
          200: 'var(--color-brand-200)',
          300: 'var(--color-brand-300)',
          500: 'var(--color-brand-500)',
          600: 'var(--color-brand-600)',
          700: 'var(--color-brand-700)',
          800: 'var(--color-brand-800)',
          900: 'var(--color-brand-900)',
        },
        paper: 'var(--color-paper)',
        ink: {
          DEFAULT: 'var(--color-ink)',
          2: 'var(--color-ink-2)',
          3: 'var(--color-ink-3)',
          4: 'var(--color-ink-4)',
        },
        rule: {
          DEFAULT: 'var(--color-rule)',
          2: 'var(--color-rule-2)',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
