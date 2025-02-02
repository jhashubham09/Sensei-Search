// tailwind.config.mjs
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "rgb(var(--background))",
        foreground: "rgb(var(--foreground))",
        primary: "rgb(var(--bg-primary))",
        secondary: "rgb(var(--bg-secondary))",
        'text-primary': "rgb(var(--text-primary))",
        'text-secondary': "rgb(var(--text-secondary))",
      },
    },
  },
  plugins: [],
};
