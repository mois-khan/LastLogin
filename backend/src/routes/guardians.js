import { Router } from "express";
import crypto from "crypto";
import { auth } from "../middleware/auth.js";
import Guardian from "../models/Guardian.js";
import User from "../models/User.js";
import VaultItem from "../models/VaultItem.js";

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
    const { name, email, walletAddress, access } = req.body;
    const g = await Guardian.create({ userId: req.user.id, name, email, walletAddress, access: access || [] });
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

// RBAC: set which vault categories a guardian may access.
r.post("/:id/access", async (req, res, next) => {
  try {
    const g = await Guardian.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { access: Array.isArray(req.body.access) ? req.body.access : [] },
      { new: true }
    );
    if (!g) return res.status(404).json({ error: "not found" });
    res.json(g);
  } catch (e) { next(e); }
});

// RBAC in action: exactly the vault items this guardian is permitted to see.
r.get("/:id/vault", async (req, res, next) => {
  try {
    const g = await Guardian.findOne({ _id: req.params.id, userId: req.user.id });
    if (!g) return res.status(404).json({ error: "not found" });
    const items = await VaultItem.find({ userId: req.user.id, type: { $in: g.access } });
    res.json({ guardian: g.name, access: g.access, items: items.map((i) => ({ id: i._id, type: i.type, label: i.label })) });
  } catch (e) { next(e); }
});

export default r;
