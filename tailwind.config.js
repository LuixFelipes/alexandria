/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'papyrus-light': '#F5E6CA',
        'papyrus-mid': '#E8D5A3',
        'papyrus-dark': '#C4A96E',
        'papyrus-border': '#B8935A',
        'ink-dark': '#2C1810',
        'ink-mid': '#5C3D2E',
        'ink-light': '#8B6914',
        'gold': '#C9A84C',
        'gold-bright': '#F0D060',
        'purple-royal': '#6B2D8B',
        'purple-light': '#9B59B6',
        'purple-pale': '#EDD6F5',
        'red-alert': '#8B1A1A',
        'green-ok': '#2D5A1B',
      },
      fontFamily: {
        'cinzel': ['var(--font-cinzel)', 'serif'],
        'garamond': ['var(--font-garamond)', 'serif'],
      },
    },
  },
  plugins: [],
}
