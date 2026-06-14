import React from "react";

// Production-grade apps never show a blank white screen. They catch render
// errors and fail gracefully. Inline styles so this works even if CSS is broken.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("LastLogin render error:", error, info);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", background: "#0A0A0E", color: "#F4F4F7", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ maxWidth: "44rem", width: "100%" }}>
          <h1 style={{ fontFamily: "Fraunces, Georgia, serif", fontSize: "1.6rem", margin: "0 0 .5rem" }}>
            Something broke while rendering.
          </h1>
          <p style={{ color: "#7C7C88", margin: "0 0 1rem" }}>
            This message replaces the old blank screen. The detail below is the exact error.
          </p>
          <pre style={{ whiteSpace: "pre-wrap", background: "#16161F", border: "1px solid #272730", borderRadius: "12px", padding: "1rem", fontSize: "12px", lineHeight: 1.5, fontFamily: "'IBM Plex Mono', monospace", color: "#F3A24C", overflow: "auto" }}>
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          <button onClick={() => location.reload()} style={{ marginTop: "1rem", padding: ".6rem 1.2rem", borderRadius: "999px", border: "none", background: "#F3A24C", color: "#0A0A0E", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </div>
    );
  }
}
