import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import Attachment from "../models/Attachment.js";
import Guardian from "../models/Guardian.js";

// Media vault — images and files. Held in memory then stored as a base64 data URL.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });
const r = Router();
r.use(auth);

// List (metadata only — never ship the bytes in the list).
r.get("/", async (req, res, next) => {
  try {
    const files = await Attachment.find({ userId: req.user.id }).sort({ createdAt: 1 }).select("-dataUrl");
    res.json(files.map((f) => ({ id: f._id, name: f.name, mimeType: f.mimeType, size: f.size, disposition: f.disposition })));
  } catch (e) { next(e); }
});

r.post("/", upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: "no file uploaded" });
    const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const a = await Attachment.create({
      userId: req.user.id, name: req.body.name || req.file.originalname,
      mimeType: req.file.mimetype, size: req.file.size, dataUrl,
      disposition: req.body.disposition === "delete" ? "delete" : "transfer",
    });
    res.json({ id: a._id, name: a.name, mimeType: a.mimeType, size: a.size, disposition: a.disposition });
  } catch (e) { next(e); }
});

// Owner views/downloads their own file (returns the bytes).
r.get("/:id", async (req, res, next) => {
  try {
    const a = await Attachment.findOne({ _id: req.params.id, userId: req.user.id });
    if (!a) return res.status(404).json({ error: "not found" });
    res.json({ id: a._id, name: a.name, mimeType: a.mimeType, dataUrl: a.dataUrl });
  } catch (e) { next(e); }
});

// Lifecycle rule. Flipping to "delete" revokes any guardian grant (isolation constraint).
r.patch("/:id/disposition", async (req, res, next) => {
  try {
    const disposition = req.body.disposition === "delete" ? "delete" : "transfer";
    const a = await Attachment.findOneAndUpdate({ _id: req.params.id, userId: req.user.id }, { disposition }, { new: true });
    if (!a) return res.status(404).json({ error: "not found" });
    if (disposition === "delete") await Guardian.updateMany({ userId: req.user.id }, { $pull: { fileAccess: a._id } });
    res.json({ id: a._id, disposition: a.disposition });
  } catch (e) { next(e); }
});

r.delete("/:id", async (req, res, next) => {
  try {
    await Attachment.deleteOne({ _id: req.params.id, userId: req.user.id });
    await Guardian.updateMany({ userId: req.user.id }, { $pull: { fileAccess: req.params.id } });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default r;
