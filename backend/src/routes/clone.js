import { Router } from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { guardianAuth } from "../middleware/guardianAuth.js";
import User from "../models/User.js";
import Guardian from "../models/Guardian.js";
import Persona from "../models/Persona.js";
import GuardianContext from "../models/GuardianContext.js";
import CloneMessage from "../models/CloneMessage.js";
import VaultItem from "../models/VaultItem.js";
import { decrypt } from "../services/crypto/vault.js";
import * as clone from "../services/ai/clone.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 } });
const r = Router();

const toUrl = (audio) => (audio ? `data:audio/mpeg;base64,${audio.toString("base64")}` : undefined);
const shape = (m) => ({ id: m._id, role: m.role, text: m.text, language: m.language, audioUrl: m.audioUrl });

// The owner's real secret values — fed to the reply scrubber so a jailbroken generation can
// never echo one to the family (defense in depth; secrets are never put in the prompt at all).
async function ownerSecrets(userId) {
  try {
    const items = await VaultItem.find({ userId, scheme: "server" }).select("blob");
    const vals = [];
    for (const i of items) {
      try {
        let f; try { f = JSON.parse(decrypt(i.blob)); } catch { f = {}; }
        for (const v of Object.values(f || {})) {
          const s = String(v ?? "").trim();
          if (s.length >= 6) vals.push(s);
        }
      } catch { /* skip unreadable */ }
    }
    return vals;
  } catch { return []; }
}

// ───────────── OWNER (logged in): build + preview your companion ─────────────

r.get("/questions", auth, (req, res) => res.json({ questions: clone.QUESTIONS }));

r.get("/persona", auth, async (req, res, next) => {
  try {
    const [p, u] = await Promise.all([
      Persona.findOne({ userId: req.user.id }),
      User.findById(req.user.id).select("gender voiceId name"),
    ]);
    res.json({
      ready: !!p?.ready, answers: p?.answers || {}, keyPhrases: p?.keyPhrases || [],
      personaPrompt: p?.personaPrompt || "", gender: u?.gender || "neutral", hasVoice: !!u?.voiceId, name: u?.name,
    });
  } catch (e) { next(e); }
});

r.post("/persona", auth, async (req, res, next) => {
  try {
    const answers = req.body.answers || {};
    const u = await User.findById(req.user.id).select("name");
    const { personaPrompt, keyPhrases } = await clone.buildPersonaPrompt(answers, u?.name || "this person");
    const p = await Persona.findOneAndUpdate(
      { userId: req.user.id }, { answers, personaPrompt, keyPhrases, ready: true }, { upsert: true, new: true }
    );
    res.json({ ready: p.ready, personaPrompt: p.personaPrompt, keyPhrases: p.keyPhrases });
  } catch (e) { next(e); }
});

// Owner previews their OWN clone while alive.
r.post("/preview", auth, async (req, res, next) => {
  try {
    const { message, language = "en-IN", withAudio } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Say something first." });
    const [p, u] = await Promise.all([
      Persona.findOne({ userId: req.user.id }),
      User.findById(req.user.id).select("name gender voiceId"),
    ]);
    if (!p?.ready) return res.status(400).json({ error: "Build your companion first." });
    const history = (await CloneMessage.find({ userId: req.user.id, ownerPreview: true }).sort({ createdAt: -1 }).limit(12)).reverse();
    await CloneMessage.create({ userId: req.user.id, ownerPreview: true, role: "guardian", text: message, language });
    const { text, audio } = await clone.cloneReply({
      name: u?.name || "I", gender: u?.gender, personaPrompt: p.personaPrompt, history,
      message, targetLang: language, voiceId: u?.voiceId, withAudio: !!withAudio,
      secrets: await ownerSecrets(req.user.id),
    });
    const audioUrl = toUrl(audio);
    await CloneMessage.create({ userId: req.user.id, ownerPreview: true, role: "clone", text, language, audioUrl });
    res.json({ text, audioUrl });
  } catch (e) { next(e); }
});

r.get("/preview/history", auth, async (req, res, next) => {
  try { res.json((await CloneMessage.find({ userId: req.user.id, ownerPreview: true }).sort({ createdAt: 1 })).map(shape)); }
  catch (e) { next(e); }
});
r.delete("/preview/history", auth, async (req, res, next) => {
  try { await CloneMessage.deleteMany({ userId: req.user.id, ownerPreview: true }); res.json({ ok: true }); }
  catch (e) { next(e); }
});

// ───────────── GUARDIAN (session token in body): talk with the departed (post-death) ─────────────

async function ensureExecuting(userId, res) {
  const u = await User.findById(userId).select("name gender voiceId estateState");
  if (!u) { res.status(404).json({ error: "estate not found" }); return null; }
  if (u.estateState !== "EXECUTING") { res.status(403).json({ error: "This becomes available once a passing is verified." }); return null; }
  return u;
}

// Personalize with a WhatsApp export. multer runs BEFORE guardianAuth so the token (a FormData
// field) is parsed first. The raw chat is summarized and discarded — only the summary is stored.
r.post("/guardian-context", upload.single("chat"), guardianAuth, async (req, res, next) => {
  try {
    const { userId, gid } = req.guardian;
    const u = await ensureExecuting(userId, res); if (!u) return;
    const g = await Guardian.findById(gid);
    const raw = req.file ? req.file.buffer.toString("utf8") : (req.body.text || "");
    if (!raw.trim()) return res.status(400).json({ error: "Upload your exported chat (.txt) or paste some of it." });
    const summary = await clone.summarizeWhatsApp(raw, u.name, g?.name || "this person");
    await GuardianContext.findOneAndUpdate({ userId, guardianId: gid }, { guardianEmail: g?.email, summary }, { upsert: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

r.post("/chat", guardianAuth, async (req, res, next) => {
  try {
    const { userId, gid } = req.guardian;
    const { message, language = "en-IN", withAudio } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: "Say something first." });
    const u = await ensureExecuting(userId, res); if (!u) return;
    const [p, ctx] = await Promise.all([
      Persona.findOne({ userId }),
      GuardianContext.findOne({ userId, guardianId: gid }),
    ]);
    const history = (await CloneMessage.find({ userId, guardianId: gid }).sort({ createdAt: -1 }).limit(12)).reverse();
    await CloneMessage.create({ userId, guardianId: gid, role: "guardian", text: message, language });
    const { text, audio } = await clone.cloneReply({
      name: u.name || "they", gender: u.gender, personaPrompt: p?.personaPrompt, guardianContext: ctx?.summary,
      history, message, targetLang: language, voiceId: u.voiceId, withAudio: !!withAudio,
      secrets: await ownerSecrets(userId),
    });
    const audioUrl = toUrl(audio);
    await CloneMessage.create({ userId, guardianId: gid, role: "clone", text, language, audioUrl });
    res.json({ text, audioUrl });
  } catch (e) { next(e); }
});

// POST (not GET) so the session token rides in the body, past the owner-token interceptor.
r.post("/history", guardianAuth, async (req, res, next) => {
  try {
    const { userId, gid } = req.guardian;
    const u = await ensureExecuting(userId, res); if (!u) return;
    const [msgs, ctx] = await Promise.all([
      CloneMessage.find({ userId, guardianId: gid }).sort({ createdAt: 1 }),
      GuardianContext.findOne({ userId, guardianId: gid }),
    ]);
    res.json({ name: u.name, hasContext: !!ctx, messages: msgs.map(shape) });
  } catch (e) { next(e); }
});

r.post("/history/clear", guardianAuth, async (req, res, next) => {
  try { await CloneMessage.deleteMany({ userId: req.guardian.userId, guardianId: req.guardian.gid }); res.json({ ok: true }); }
  catch (e) { next(e); }
});

export default r;
