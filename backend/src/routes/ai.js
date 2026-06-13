import { Router } from "express";
import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";
import Message from "../models/Message.js";
import * as gemini from "../services/ai/gemini.js";
import * as eleven from "../services/ai/elevenlabs.js";
import { generateLegacyMessage } from "../services/ai/legacyMessage.js";

// Cross-platform temp dir (the old "/tmp/uploads" doesn't exist on Windows → upload 500s).
const UPLOAD_DIR = path.join(os.tmpdir(), "lastlogin-uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });
const r = Router();

// Will assistant chat (Gemini)
r.post("/will-assistant", auth, async (req, res, next) => {
  try {
    const { messages } = req.body; // [{role, text}]
    res.json(await gemini.chatWillAssistant(messages || []));
  } catch (e) { next(e); }
});

// Clone the user's voice from a ~60s sample (ElevenLabs)
r.post("/voice/clone", auth, upload.single("sample"), async (req, res, next) => {
  try {
    const voiceId = await eleven.cloneVoice(req.file.path, `LastLogin ${req.user.email}`);
    await User.findByIdAndUpdate(req.user.id, { voiceId });
    fs.unlink(req.file.path, () => {});
    res.json({ voiceId });
  } catch (e) { next(e); }
});

// Generate + store a final message in the cloned voice + family's language
r.post("/messages", auth, async (req, res, next) => {
  try {
    const { recipientName, recipients, scope, text, language, deliverOn, deliverAt } = req.body;
    const user = await User.findById(req.user.id);
    if (!user.voiceId) return res.status(400).json({ error: "clone your voice first" });

    const { translatedText, audio, targetLang } = await generateLegacyMessage({
      text, targetLang: language || "hi-IN", voiceId: user.voiceId,
    });

    // global = everyone (memorial + all guardians); assigned = only the listed emails.
    const finalScope = scope === "global" ? "global" : "assigned";
    const recips = Array.isArray(recipients) ? recipients.map((e) => String(e).trim()).filter(Boolean) : [];
    // For the hackathon, store the audio as a base64 data URL (swap for GridFS/S3 later).
    const audioUrl = `data:audio/mpeg;base64,${audio.toString("base64")}`;
    const msg = await Message.create({
      userId: req.user.id, recipientName, scope: finalScope, recipients: recips, recipientEmail: recips[0] || "",
      text: translatedText, language: targetLang, audioUrl,
      deliverOn: deliverOn || "death", deliverAt,
    });
    res.json({ id: msg._id, translatedText, audioUrl, language: targetLang, scope: finalScope, recipients: recips });
  } catch (e) { next(e); }
});

// List the user's saved messages (so they persist across navigation).
r.get("/messages", auth, async (req, res, next) => {
  try { res.json(await Message.find({ userId: req.user.id }).sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});

// Verify an uploaded death certificate (Gemini Vision)
r.post("/verify-certificate", auth, upload.single("cert"), async (req, res, next) => {
  try {
    const b64 = fs.readFileSync(req.file.path).toString("base64");
    const result = await gemini.verifyDeathCertificate(b64, req.file.mimetype);
    fs.unlink(req.file.path, () => {});
    res.json(result);
  } catch (e) { next(e); }
});

// Draft a platform closure email (Gemini)
r.post("/draft-closure", auth, async (req, res, next) => {
  try {
    const { platform, accountType, deceasedName } = req.body;
    res.json({ body: await gemini.draftClosureEmail(platform, accountType, deceasedName) });
  } catch (e) { next(e); }
});

// AI remembrance for the family dashboard (Gemini)
r.post("/obituary", auth, async (req, res, next) => {
  try {
    res.json({ text: await gemini.generateObituary(req.body.profile || {}) });
  } catch (e) { next(e); }
});

export default r;
