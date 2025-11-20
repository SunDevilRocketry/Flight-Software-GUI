/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "base": "var(--base)",
        "base-100": "var(--base-100)",
        "base-200": "var(--base-200)",
        "base-300": "var(--base-300)",
        "base-400": "var(--base-400)",
        "base-500": "var(--base-500)",
        "base-600": "var(--base-600)",
        "base-700": "var(--base-700)",
        "highlight": "var(--highlight)",
        "accent-red": "var(--accent-red)",
        "accent-green": "var(--accent-green)",
       
      },
    },
  },
  plugins: [],
};
