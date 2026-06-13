import { Router } from "express";
import { auth } from "../middleware/auth.js";
import VaultItem from "../models/VaultItem.js";
import User from "../models/User.js";
import { encrypt, decrypt, vaultFingerprint } from "../services/crypto/vault.js";

const r = Router();
r.use(auth);

// --- Zero-knowledge master key (salt + verifier live with the user) ---
// The server stores ONLY the salt and a client-encrypted verifier blob. It never
// sees the passphrase or the derived key.
r.get("/key", async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id).select("vaultSalt vaultVerifier");
    res.json({ salt: u?.vaultSalt || null, verifier: u?.vaultVerifier || null });
  } catch (e) { next(e); }
});

r.post("/key", async (req, res, next) => {
  try {
    const { salt, verifier } = req.body;
    const u = await User.findById(req.user.id).select("vaultSalt");
    if (u?.vaultSalt) return res.status(409).json({ error: "vault key already set" });
    await User.findByIdAndUpdate(req.user.id, { vaultSalt: salt, vaultVerifier: verifier });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// --- Items ---
r.get("/", async (req, res, next) => {
  try {
    const items = await VaultItem.find({ userId: req.user.id });
    res.json(items.map((i) => ({ id: i._id, type: i.type, label: i.label, scheme: i.scheme })));
  } catch (e) { next(e); }
});

r.post("/", async (req, res, next) => {
  try {
    const { type, label, blob, fields, secret } = req.body;
    let scheme, storedBlob;
    if (blob && blob.iv && blob.data) {
      scheme = "client"; storedBlob = { iv: blob.iv, data: blob.data }; // zero-knowledge ciphertext from the browser
    } else {
      scheme = "server"; storedBlob = encrypt(fields ? JSON.stringify(fields) : (secret ?? "")); // legacy fallback
    }
    const item = await VaultItem.create({ userId: req.user.id, type, label, scheme, blob: storedBlob });
    res.json({ id: item._id, type, label, scheme });
  } catch (e) { next(e); }
});

// Reveal: client-scheme items return ciphertext (browser decrypts); legacy items decrypt server-side.
r.get("/:id/reveal", async (req, res, next) => {
  try {
    const item = await VaultItem.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: "not found" });
    if (item.scheme === "client") return res.json({ scheme: "client", blob: { iv: item.blob.iv, data: item.blob.data } });
    const raw = decrypt(item.blob);
    let fields; try { fields = JSON.parse(raw); } catch { fields = { value: raw }; }
    res.json({ scheme: "server", fields });
  } catch (e) { next(e); }
});

// Integrity fingerprint of the whole vault — what gets anchored on-chain.
r.get("/fingerprint", async (req, res, next) => {
  try {
    const items = await VaultItem.find({ userId: req.user.id });
    res.json({ fingerprint: vaultFingerprint(items) });
  } catch (e) { next(e); }
});

export default r;
