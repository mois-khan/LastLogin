import { Router } from "express";
import { auth } from "../middleware/auth.js";
import VaultItem from "../models/VaultItem.js";
import User from "../models/User.js";
import Guardian from "../models/Guardian.js";
import { encrypt, decrypt, vaultFingerprint } from "../services/crypto/vault.js";
import * as chain from "../services/blockchain/ethers.js";

const r = Router();
r.use(auth);

// --- Zero-knowledge master key (salt + verifier live with the user) ---
// The server stores ONLY the salt and a client-encrypted verifier blob. It never
// sees the passphrase or the derived key.
r.get("/key", async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id).select("vaultSalt vaultVerifier vaultWrappedDek");
    res.json({ salt: u?.vaultSalt || null, verifier: u?.vaultVerifier || null, wrappedDek: u?.vaultWrappedDek || null });
  } catch (e) { next(e); }
});

r.post("/key", async (req, res, next) => {
  try {
    const { salt, verifier, wrappedDek } = req.body;
    const u = await User.findById(req.user.id).select("vaultSalt");
    if (u?.vaultSalt) return res.status(409).json({ error: "vault key already set" });
    await User.findByIdAndUpdate(req.user.id, { vaultSalt: salt, vaultVerifier: verifier, vaultWrappedDek: wrappedDek });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// --- Items ---
r.get("/", async (req, res, next) => {
  try {
    const items = await VaultItem.find({ userId: req.user.id }).sort({ createdAt: 1 });
    res.json(items.map((i) => ({ id: i._id, type: i.type, label: i.label, platform: i.platform, disposition: i.disposition, scheme: i.scheme })));
  } catch (e) { next(e); }
});

r.post("/", async (req, res, next) => {
  try {
    const { type, label, blob, fields, secret, platform, disposition } = req.body;
    let scheme, storedBlob;
    if (blob && blob.iv && blob.data) {
      scheme = "client"; storedBlob = { iv: blob.iv, data: blob.data }; // legacy zero-knowledge ciphertext
    } else {
      scheme = "server"; storedBlob = encrypt(fields ? JSON.stringify(fields) : (secret ?? "")); // encrypted at rest, server can open for handover
    }
    const item = await VaultItem.create({
      userId: req.user.id, type, label, platform,
      disposition: disposition === "delete" ? "delete" : "transfer",
      scheme, blob: storedBlob,
    });
    res.json({ id: item._id, type, label, platform, disposition: item.disposition, scheme });
  } catch (e) { next(e); }
});

// Set an asset's lifecycle rule. Flipping to "delete" also revokes any guardian grant —
// a deletion-flagged asset must be invisible to every guardian (data-isolation constraint).
r.patch("/:id/disposition", async (req, res, next) => {
  try {
    const disposition = req.body.disposition === "delete" ? "delete" : "transfer";
    const item = await VaultItem.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id }, { disposition }, { new: true }
    );
    if (!item) return res.status(404).json({ error: "not found" });
    if (disposition === "delete")
      await Guardian.updateMany({ userId: req.user.id }, { $pull: { assetAccess: item._id } });
    res.json({ id: item._id, disposition: item.disposition });
  } catch (e) { next(e); }
});

r.delete("/:id", async (req, res, next) => {
  try {
    await VaultItem.deleteOne({ _id: req.params.id, userId: req.user.id });
    await Guardian.updateMany({ userId: req.user.id }, { $pull: { assetAccess: req.params.id } });
    res.json({ ok: true });
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

// Seal: compute the vault's integrity fingerprint AND anchor it on-chain (setVaultHash),
// so "sealed" is a real, tamper-evident commitment on Sepolia — not just a local hash.
// Anchoring is best-effort: a Mongo-only demo (no contract/keys configured) still returns
// the fingerprint, just without a txHash.
r.get("/fingerprint", async (req, res, next) => {
  try {
    const items = await VaultItem.find({ userId: req.user.id });
    const fingerprint = vaultFingerprint(items);
    let txHash = null;
    try { txHash = await chain.anchorVaultHash(fingerprint); }
    catch (e) { console.warn("vault anchor skipped:", e.message); }
    res.json({ fingerprint, txHash });
  } catch (e) { next(e); }
});

export default r;
