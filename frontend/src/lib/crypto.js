// Zero-knowledge vault crypto — runs in the BROWSER only.
// A key is derived from the user's master passphrase via PBKDF2 and never leaves
// the device. The server stores only AES-256-GCM ciphertext it cannot open.
const te = new TextEncoder();
const td = new TextDecoder();

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

/** Random 16-byte salt (base64) — stored per user alongside the ciphertext. */
export function genSalt() {
  return toB64(crypto.getRandomValues(new Uint8Array(16)));
}

/** Derive a non-extractable AES-GCM key from a passphrase + salt. */
export async function deriveKey(passphrase, saltB64) {
  const base = await crypto.subtle.importKey("raw", te.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromB64(saltB64), iterations: 200_000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Encrypt a JS object → { iv, data } (both base64). */
export async function encryptJSON(obj, key) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, te.encode(JSON.stringify(obj)));
  return { iv: toB64(iv), data: toB64(ct) };
}

/** Decrypt { iv, data } → the original JS object. Throws if the passphrase is wrong. */
export async function decryptJSON(blob, key) {
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(blob.iv) }, key, fromB64(blob.data));
  return JSON.parse(td.decode(pt));
}

/** Quick check that a passphrase derives a key able to open a known sample blob. */
export async function verifyPassphrase(blob, passphrase, saltB64) {
  try { await decryptJSON(blob, await deriveKey(passphrase, saltB64)); return true; }
  catch { return false; }
}
