// The signature element. The flame flickers while the estate is ACTIVE and goes
// still the moment the trigger fires — the visual heartbeat of the product.
export default function Candle({ still = false, size = 64 }) {
  // Lit: warm ember. Extinguished: ash + mist, so "still" reads as gone, not dimmed.
  const outer = still ? "#C8C2B8" : "#C8743A";
  const inner = still ? "#9A938A" : "#F2B66B";
  return (
    <svg width={size} height={size * 1.4} viewBox="0 0 64 90" aria-hidden="true">
      {/* flame */}
      <g className={still ? "flame flame--still" : "flame"} style={{ transformBox: "fill-box" }}>
        <path d="M32 4 C40 16 46 22 46 34 a14 14 0 0 1 -28 0 C18 22 24 16 32 4 Z" fill={outer} style={{ transition: "fill .9s ease" }} />
        <path d="M32 16 C37 24 40 28 40 35 a8 8 0 0 1 -16 0 C24 28 27 24 32 16 Z" fill={inner} style={{ transition: "fill .9s ease" }} />
      </g>
      {/* candle body */}
      <rect x="22" y="50" width="20" height="36" rx="4" fill="#FBF7F0" stroke="#E7E0D4" />
      <rect x="30" y="46" width="4" height="8" rx="2" fill="#2B2A28" />
    </svg>
  );
}
