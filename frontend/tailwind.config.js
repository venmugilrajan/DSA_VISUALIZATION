/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        surface: "var(--bg-surface)",
        panel: "var(--bg-elevated)",
        textMain: "var(--text-primary)",
        textMuted: "var(--text-secondary)",
        borderColor: "var(--border-hairline)",
        primary: "var(--accent-signal)",
        accent: "var(--accent-compare)",
        danger: "var(--accent-danger)",
      },
    },
  },
  plugins: [],
}
