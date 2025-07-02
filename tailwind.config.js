/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx,html}",
    "./src/index.html"
  ],
  theme: {
    extend: {
      colors: {
        editor: {
          bg: '#1e1e1e',
          sidebar: '#252526',
          border: '#3e3e42',
          text: '#cccccc',
          hover: '#2a2d2e'
        }
      }
    },
  },
  plugins: [],
} 