// Phantom (Solana) wallet helpers - connect + sign a message. No SOL, no fees, no on-chain
// transaction: signing a message is a free cryptographic "I own this wallet" proof, which is
// exactly what a guardian needs to unlock a crypto recovery phrase the owner granted them.

// Phantom injects window.phantom.solana (and a legacy window.solana). Returns the provider or null.
export function getPhantom() {
  if (typeof window === "undefined") return null;
  const p = window.phantom?.solana || (window.solana?.isPhantom ? window.solana : null);
  return p || null;
}

export const hasPhantom = () => !!getPhantom();

// Open Phantom and return the connected wallet address (base58 public key string).
export async function connectPhantom() {
  const p = getPhantom();
  if (!p) throw new Error("Phantom wallet not found. Install the Phantom extension to continue.");
  const res = await p.connect();
  return (res?.publicKey || p.publicKey)?.toString() || "";
}

// Ask Phantom to sign a plain message. Free, instant, no SOL. Returns the base64 signature.
// The popup is the moment the guardian proves they hold the wallet.
export async function signPhantomMessage(message) {
  const p = getPhantom();
  if (!p) throw new Error("Phantom wallet not found.");
  if (!p.publicKey) await p.connect();
  const encoded = new TextEncoder().encode(message);
  const { signature } = await p.signMessage(encoded, "utf8");
  // Uint8Array -> base64, so it can travel as a string if we ever verify server-side.
  return btoa(String.fromCharCode(...signature));
}

// Two addresses are the same wallet (base58 is case-sensitive, so just trim + compare).
export const addressesMatch = (a, b) =>
  !!a && !!b && String(a).trim() === String(b).trim();
