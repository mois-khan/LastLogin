import { Router } from "express";
import { auth } from "../middleware/auth.js";
import VaultItem from "../models/VaultItem.js";
import { encrypt, decrypt, vaultFingerprint } from "../services/crypto/vault.js";

const r = Router();
r.use(auth);

r.get("/", async (req, res, next) => {
  try {
    const items = await VaultItem.find({ userId: req.user.id });
    res.json(items.map((i) => ({ id: i._id, type: i.type, label: i.label })));
  } catch (e) { next(e); }
});

r.post("/", async (req, res, next) => {
  try {
    const { type, label, secret } = req.body;
    const item = await VaultItem.create({ userId: req.user.id, type, label, blob: encrypt(secret) });
    res.json({ id: item._id, type, label });
  } catch (e) { next(e); }
});

// Decrypt one item (in real life: only after trigger / for owner). Demo convenience.
r.get("/:id/reveal", async (req, res, next) => {
  try {
    const item = await VaultItem.findOne({ _id: req.params.id, userId: req.user.id });
    if (!item) return res.status(404).json({ error: "not found" });
    res.json({ secret: decrypt(item.blob) });
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
