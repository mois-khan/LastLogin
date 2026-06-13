/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#FBF7F0",
        cloud: "#FFFDF8",
        card: "#FFFFFF",
        ink: "#2B2A28",
        graphite: "#57534E",
        ember: { DEFAULT: "#C8743A", 600: "#B5652F" },
        sage: { DEFAULT: "#6E8B74", 600: "#5C7762" },
        mist: "#9A938A",
        line: "#E7E0D4",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      fontSize: {
        // intentional display scale
        hero: ["3.25rem", { lineHeight: "1.04", letterSpacing: "-0.025em" }],
        title: ["2rem", { lineHeight: "1.1", letterSpacing: "-0.02em" }],
        h: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        card: "0 1px 3px rgba(43,42,40,0.05), 0 10px 28px -16px rgba(43,42,40,0.12)",
        lift: "0 2px 8px rgba(43,42,40,0.06), 0 22px 44px -22px rgba(43,42,40,0.20)",
        focus: "0 0 0 3px rgba(200,116,58,0.18)",
      },
      borderRadius: { xl2: "1.25rem" },
      maxWidth: { content: "64rem" },
    },
  },
  plugins: [],
};
