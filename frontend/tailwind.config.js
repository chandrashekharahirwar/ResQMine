/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        safe: '#3ED598',
        watch: '#F5C542',
        critical: '#F5484D',
        accent: '#5B8DF7',
        bgDark: '#0B1120',
        bgElevated: '#131C2E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glass-glow': '0 0 20px rgba(91, 141, 247, 0.25)',
        'critical-glow': '0 0 25px rgba(245, 72, 77, 0.35)',
      }
    },
  },
  plugins: [],
}
