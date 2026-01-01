import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Original theme colors (kept for compatibility)
        'emerald-green': '#2ECC71',
        'dark-green': '#1E8449',
        'soft-mint': '#D1F2EB',
        'stone-gray': '#F2F3F4',
        // Light theme colors
        'light-bg': '#FFFFFF',
        'light-surface': '#F5F5F5',
        'light-primary': '#4CAF50',
        'light-primary-alt': '#1E88E5',
        'light-text': '#212121',
        'light-text-secondary': '#757575',
        'light-accent': '#FF9800',
        'light-border': '#E0E0E0',
        // Dark theme colors
        'dark-bg': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-primary': '#4CAF50',
        'dark-primary-alt': '#90CAF9',
        'dark-text': '#FFFFFF',
        'dark-text-secondary': '#B0B0B0',
        'dark-accent': '#FFB74D',
        'dark-border': '#333333',
      },
    },
  },
  plugins: [],
}
export default config

