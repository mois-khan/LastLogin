/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Deep, cinematic dark — the candle becomes a light source.
        paper: "#0A0A0E", // page base (near-black, faint cool)
        cloud: "#101016", // recessed inputs / wells
        card: "#16161F", // elevated surfaces
        ink: "#F4F4F7", // primary text (off-white)
        graphite: "#B4B4C0", // secondary text
        ember: { DEFAULT: "#F3A24C", 600: "#E98C34" }, // the flame — luminous amber accent
        sage: { DEFAULT: "#5FD3A3", 600: "#46BE8C" }, // alive / verified (mint)
        mist: "#7C7C88", // muted / placeholder
        line: "#272730", // hairline borders
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        body: ["Inter", "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "monospace"],
      },
      fontSize: {
        // bold display scale
        hero: ["3.75rem", { lineHeight: "1.02", letterSpacing: "-0.03em" }],
        title: ["2.25rem", { lineHeight: "1.08", letterSpacing: "-0.025em" }],
        h: ["1.375rem", { lineHeight: "1.2", letterSpacing: "-0.01em" }],
      },
      boxShadow: {
        // depth on dark = a top inner highlight + a soft black drop
        card: "inset 0 1px 0 rgba(255,255,255,0.05), 0 24px 50px -34px rgba(0,0,0,0.85)",
        lift: "inset 0 1px 0 rgba(255,255,255,0.07), 0 40px 74px -38px rgba(0,0,0,0.95)",
        focus: "0 0 0 3px rgba(243,162,76,0.35)",
        glow: "0 0 30px -4px rgba(243,162,76,0.5)", // ember glow for the primary action + flame
      },
      borderRadius: { xl2: "1.25rem" },
      maxWidth: { content: "64rem" },
    },
  },
  plugins: [],
};
