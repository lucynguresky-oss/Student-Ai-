/** Learnix brand preset (§8). Import from apps/web + packages/ui tailwind configs. */
module.exports = {
  theme: {
    extend: {
      backgroundImage: {
        'lx-gradient': 'linear-gradient(90deg, #2dd4bf 0%, #3b82f6 50%, #9333ea 100%)',
      },
      colors: {
        lx: { teal: '#2dd4bf', blue: '#3b82f6', purple: '#9333ea' },
      },
      borderRadius: { DEFAULT: '1rem', lx: '1rem' },
      minHeight: { tap: '44px' },
      minWidth: { tap: '44px' },
    },
  },
  darkMode: 'class',
};
