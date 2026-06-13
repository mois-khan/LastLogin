// Shamir Secret Sharing over GF(256). Splits a secret into N shares such that any
// THRESHOLD of them reconstruct it, and fewer reveal nothing. We use it to split the
// vault key across the 3 guardians so any 2 (the on-chain quorum) can recover it —
// while no single guardian, and not the server, ever can.

// GF(256) log/exp tables (AES field 0x11b, generator 3).
const EXP = new Uint8Array(256);
const LOG = new Uint8Array(256);
{
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    let d = x << 1;
    if (d & 0x100) d ^= 0x11b;
    x = (d ^ x) & 0xff; // x *= 3
  }
}
const gmul = (a, b) => (a === 0 || b === 0 ? 0 : EXP[(LOG[a] + LOG[b]) % 255]);
const gdiv = (a, b) => (a === 0 ? 0 : EXP[(LOG[a] - LOG[b] + 255) % 255]);

const toHex = (u8) => [...u8].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (s) => Uint8Array.from(s.match(/../g).map((h) => parseInt(h, 16)));

function evalPoly(coeffs, x) {
  let r = 0; // Horner's method in GF(256)
  for (let i = coeffs.length - 1; i >= 0; i--) r = gmul(r, x) ^ coeffs[i];
  return r;
}

/** Split a secret (Uint8Array) into `shares` hex strings; any `threshold` recombine it. */
export function split(secret, shares = 3, threshold = 2) {
  const ys = Array.from({ length: shares }, () => new Uint8Array(secret.length));
  for (let b = 0; b < secret.length; b++) {
    const coeffs = new Uint8Array(threshold);
    coeffs[0] = secret[b];
    crypto.getRandomValues(coeffs.subarray(1)); // random higher-order coefficients
    for (let s = 0; s < shares; s++) ys[s][b] = evalPoly(coeffs, s + 1);
  }
  return ys.map((y, s) => toHex(Uint8Array.from([s + 1, ...y]))); // prefix the x-coordinate
}

/** Reconstruct the secret from any `threshold`+ shares (Lagrange interpolation at x=0). */
export function combine(shareHexes) {
  const shares = shareHexes.map(fromHex).map((u) => ({ x: u[0], y: u.subarray(1) }));
  const len = shares[0].y.length;
  const secret = new Uint8Array(len);
  for (let b = 0; b < len; b++) {
    let acc = 0;
    for (let i = 0; i < shares.length; i++) {
      let num = 1, den = 1;
      for (let j = 0; j < shares.length; j++) {
        if (i === j) continue;
        num = gmul(num, shares[j].x);             // 0 - x_j == x_j in GF(256)
        den = gmul(den, shares[i].x ^ shares[j].x); // x_i - x_j == x_i XOR x_j
      }
      acc ^= gmul(shares[i].y[b], gdiv(num, den));
    }
    secret[b] = acc;
  }
  return secret;
}
