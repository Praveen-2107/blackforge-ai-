/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cyber-cyan': '#00d9ff',
        'cyber-purple': '#c000ff',
        'cyber-blue': '#0066ff',
      },
      backgroundImage: {
        'cyber-gradient': 'linear-gradient(135deg, #050810 0%, #0f172a 100%)',
        'neon-gradient': 'linear-gradient(135deg, #00d9ff 0%, #c000ff 100%)',
      },
    },
  },
  plugins: [],
}