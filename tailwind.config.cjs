/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        sidebar: 'var(--sidebar)',
        card: 'var(--card)',
        'text-main': 'var(--text-main)',
        'text-muted': 'var(--text-muted)',
        discord: {
          blurple: 'var(--accent)',
          green: '#57F287',
          yellow: '#FEE75C',
          red: '#ED4245',
          fuchsia: '#EB459E',
          white: '#FFFFFF',
          black: '#23272A',
          discord_white: '#FFFFFF'
        },
      },
    },
  },
  plugins: [],
}
