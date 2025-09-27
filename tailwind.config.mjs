/** @type {import('tailwindcss').Config} */
export default {
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
        "highlight": "var(--highlight)",
        "accent-red": "var(--accent-red)",
        "accent-green": "var(--accent-green)",
       
      },
    },
  },
  plugins: [],
};
