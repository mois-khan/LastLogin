import crypto from "crypto";

const ALGO = "aes-256-gcm";

// Derive a stable 32-byte key from the env master key (hex or passphrase).
function getKey() {
  const raw = process.env.VAULT_MASTER_KEY || "";
  if (/^[0-9a-fA-F]{64}$/.test(raw)) return Buffer.from(raw, "hex");
  // passphrase fallback: hash to 32 bytes
  return crypto.createHash("sha256").update(raw).digest();
}

export function encrypt(plaintext) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(String(plaintext), "utf8"), cipher.final()]);
  return {
    iv: iv.toString("hex"),
    tag: cipher.getAuthTag().toString("hex"),
    data: enc.toString("hex"),
  };
}

export function decrypt(blob) {
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGO, key, Buffer.from(blob.iv, "hex"));
  decipher.setAuthTag(Buffer.from(blob.tag, "hex"));
  return Buffer.concat([
    decipher.update(Buffer.from(blob.data, "hex")),
    decipher.final(),
  ]).toString("utf8");
}

// keccak-style integrity fingerprint of the whole vault, anchored on-chain.
export function vaultFingerprint(items) {
  const stable = JSON.stringify(items.map((i) => ({ t: i.type, b: i.blob })));
  return "0x" + crypto.createHash("sha256").update(stable).digest("hex");
}
