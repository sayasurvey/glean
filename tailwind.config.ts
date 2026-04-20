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
          25:  '#f8fbf8',
          50:  '#f3f7f3',
          100: '#e8f0e8',
          200: '#d3e4d8',
          300: '#b6d3bf',
          500: '#5a9072',
          600: '#3f7553',
          700: '#2d5a3d',
          800: '#1f4a36',
          900: '#14332a',
        },
        paper: '#fafaf7',
        ink: {
          DEFAULT: '#16221a',
          2: '#455048',
          3: '#768279',
          4: '#a6b0a8',
        },
        rule: {
          DEFAULT: '#e6ebe6',
          2: '#eef1ee',
        },
      },
    },
  },
  plugins: [],
} satisfies Config
