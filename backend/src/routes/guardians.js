import { Router } from "express";
import crypto from "crypto";
import { auth } from "../middleware/auth.js";
import Guardian from "../models/Guardian.js";
import User from "../models/User.js";
import VaultItem from "../models/VaultItem.js";
import Attachment from "../models/Attachment.js";

const r = Router();
r.use(auth);

const hashAnswer = (a) => crypto.createHash("sha256").update(String(a).trim().toLowerCase()).digest("hex");

r.get("/", async (req, res, next) => {
  try {
    const guardians = await Guardian.find({ userId: req.user.id });
    res.json({ guardians, confirmed: guardians.filter((g) => g.confirmed).length, threshold: 2 });
  } catch (e) { next(e); }
});

r.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, walletAddress, access } = req.body;
    const g = await Guardian.create({ userId: req.user.id, name, email, phone, walletAddress, access: access || [] });
    res.json(g);
  } catch (e) { next(e); }
});

// Optional security question (owner sets; the guardian answers it at confirm time).
r.get("/security", async (req, res, next) => {
  try {
    const u = await User.findById(req.user.id).select("securityQuestion");
    res.json({ question: u?.securityQuestion?.question || null });
  } catch (e) { next(e); }
});

r.post("/security", async (req, res, next) => {
  try {
    const { question, answer } = req.body;
    if (!question || !answer) {
      await User.findByIdAndUpdate(req.user.id, { $unset: { securityQuestion: "" } });
      return res.json({ ok: true, cleared: true });
    }
    await User.findByIdAndUpdate(req.user.id, { securityQuestion: { question, answerHash: hashAnswer(answer) } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Per-guardian grants: exactly which assets + files this guardian may receive.
// Each guardian's grants are stored independently - isolated, per the spec.
r.post("/:id/access", async (req, res, next) => {
  try {
    const patch = {};
    if (Array.isArray(req.body.assetAccess)) patch.assetAccess = req.body.assetAccess;
    if (Array.isArray(req.body.fileAccess)) patch.fileAccess = req.body.fileAccess;
    if (Array.isArray(req.body.access)) patch.access = req.body.access; // legacy categories
    const g = await Guardian.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, patch, { new: true });
    if (!g) return res.status(404).json({ error: "not found" });
    res.json(g);
  } catch (e) { next(e); }
});

// Configuration panel for one guardian: every TRANSFERABLE asset/file + what's granted.
// Deletion-flagged items are excluded entirely - they can never be toggled on for anyone.
r.get("/:id/config", async (req, res, next) => {
  try {
    const g = await Guardian.findOne({ _id: req.params.id, userId: req.user.id });
    if (!g) return res.status(404).json({ error: "not found" });
    const [assets, files] = await Promise.all([
      VaultItem.find({ userId: req.user.id, disposition: "transfer" }).sort({ createdAt: 1 }),
      Attachment.find({ userId: req.user.id, disposition: "transfer" }).sort({ createdAt: 1 }),
    ]);
    const granted = new Set((g.assetAccess || []).map(String));
    const grantedFiles = new Set((g.fileAccess || []).map(String));
    res.json({
      guardian: { id: g._id, name: g.name, email: g.email },
      assets: assets.map((i) => ({ id: i._id, type: i.type, label: i.label, platform: i.platform, granted: granted.has(String(i._id)) })),
      files: files.map((f) => ({ id: f._id, name: f.name, mimeType: f.mimeType, size: f.size, granted: grantedFiles.has(String(f._id)) })),
    });
  } catch (e) { next(e); }
});

export default r;
