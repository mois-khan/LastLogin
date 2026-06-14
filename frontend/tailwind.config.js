/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      // Colors resolve from CSS variables, so the whole app flips with a `.dark` class on <html>.
      colors: {
        paper: "rgb(var(--paper) / <alpha-value>)",
        cloud: "rgb(var(--cloud) / <alpha-value>)",
        card: "rgb(var(--card) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        graphite: "rgb(var(--graphite) / <alpha-value>)",
        mist: "rgb(var(--mist) / <alpha-value>)",
        line: "rgb(var(--line) / <alpha-value>)",
        ember: { DEFAULT: "rgb(var(--ember) / <alpha-value>)", 600: "rgb(var(--ember-600) / <alpha-value>)" },
        sage: { DEFAULT: "rgb(var(--sage) / <alpha-value>)", 600: "rgb(var(--sage-600) / <alpha-value>)" },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      fontSize: {
        // big, bold display scale
        hero: ["3.75rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        title: ["2.25rem", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        h: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        // shadow strings also flip per theme via CSS variables
        card: "var(--shadow-card)",
        lift: "var(--shadow-lift)",
        focus: "0 0 0 3px rgb(var(--ember) / 0.35)",
        glow: "var(--shadow-glow)",
      },
      borderRadius: { xl2: "1.25rem" },
      maxWidth: { content: "64rem" },
    },
  },
  plugins: [],
};
