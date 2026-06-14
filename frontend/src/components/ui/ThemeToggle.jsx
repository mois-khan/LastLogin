import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

// Flips `.dark` on <html>, remembers the choice, and keeps the mobile chrome colour in sync.
// The initial state is set before paint by the inline script in index.html (light by default).
export default function ThemeToggle({ className = "" }) {
  const [dark, setDark] = useState(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
  );

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", dark);
    try { localStorage.setItem("ll_theme", dark ? "dark" : "light"); } catch {}
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", dark ? "#0A0A0E" : "#FFFFFF");
  }, [dark]);

  return (
    <button onClick={() => setDark((d) => !d)} title={dark ? "Switch to light" : "Switch to dark"}
      aria-label="Toggle dark mode"
      className={`grid place-items-center h-9 w-9 rounded-full border border-line text-graphite hover:text-ink hover:bg-line/60 transition ${className}`}>
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
