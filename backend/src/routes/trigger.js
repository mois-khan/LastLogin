import { Router } from "express";
import multer from "multer";
import fs from "fs";
import os from "os";
import path from "path";
import crypto from "crypto";
import { auth } from "../middleware/auth.js";
import { sendEmail } from "../services/notify/email.js";
import User from "../models/User.js";
import Guardian from "../models/Guardian.js";
import VaultItem from "../models/VaultItem.js";
import { decrypt } from "../services/crypto/vault.js";
import Message from "../models/Message.js";
import Attachment from "../models/Attachment.js";
import TriggerEvent from "../models/TriggerEvent.js";
import Otp from "../models/Otp.js";
import * as gemini from "../services/ai/gemini.js";
import * as chain from "../services/blockchain/ethers.js";
import jwt from "jsonwebtoken";

const UPLOAD_DIR = path.join(os.tmpdir(), "lastlogin-uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });
const r = Router();
// OTPs persisted in Mongo (survive a backend reload; the in-memory Map did not).
async function setOtp(key, code) {
  await Otp.findOneAndUpdate({ key }, { code, expiresAt: new Date(Date.now() + 10 * 60 * 1000) }, { upsert: true });
}
async function takeOtp(key, code) {
  const rec = await Otp.findOne({ key });
  if (!rec || rec.code !== code || rec.expiresAt < new Date()) return false;
  await Otp.deleteOne({ key });
  return true;
}
const escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Exactly what one guardian is owed for one estate: their granted + transfer-flagged assets
// (decrypted), granted + transfer-flagged files, and the delivered messages. Deletion items
// are excluded at the query level - they can never reach a guardian.
async function guardianGrants(g, user) {
  if (user?.estateState !== "EXECUTING") return { items: [], files: [], messages: [] };
  const found = await VaultItem.find({ _id: { $in: g.assetAccess || [] }, userId: g.userId, disposition: "transfer" });
  const items = found.map((i) => {
    if (i.scheme === "server") {
      try {
        const raw = decrypt(i.blob);
        let fields; try { fields = JSON.parse(raw); } catch { fields = { value: raw }; }
        return { type: i.type, label: i.label, platform: i.platform, fields };
      } catch { return { type: i.type, label: i.label, platform: i.platform, locked: true }; }
    }
    // Zero-knowledge item: the server cannot open it. Hand the guardian the ciphertext so the
    // browser can decrypt it AFTER two guardians combine their recovery codes to rebuild the DEK.
    return { type: i.type, label: i.label, platform: i.platform, scheme: "client", cipher: { iv: i.blob?.iv, data: i.blob?.data } };
  });
  const gf = await Attachment.find({ _id: { $in: g.fileAccess || [] }, userId: g.userId, disposition: "transfer" });
  const files = gf.map((f) => ({ id: f._id, name: f.name, mimeType: f.mimeType, size: f.size, dataUrl: f.dataUrl }));
  // A guardian sees a message if it's global, or if their email is one of its recipients.
  const ge = String(g.email || "").toLowerCase();
  const messages = (await Message.find({ userId: g.userId, delivered: true }))
    .filter((m) => m.scope === "global" || msgRecipients(m).includes(ge))
    .map((m) => ({ id: m._id, recipientName: m.recipientName, text: m.text, audioUrl: m.audioUrl, language: m.language, scope: m.scope }));
  return { items, files, messages };
}

// Recipients of a message (new array; falls back to the legacy single field), lowercased.
function msgRecipients(m) {
  return (m.recipients?.length ? m.recipients : (m.recipientEmail ? [m.recipientEmail] : [])).map((e) => String(e).toLowerCase());
}

async function guardianCounts(userId) {
  const [totalGuardians, confirmedGuardians] = await Promise.all([
    Guardian.countDocuments({ userId }),
    Guardian.countDocuments({ userId, confirmed: true }),
  ]);
  return { confirmedGuardians, threshold: 2, totalGuardians };
}

// Short-lived guardian session, issued after email+OTP. Held in browser memory only, so a
// fresh visit always re-verifies. Carries only this guardian's identity - never the others.
function guardianAuth(req, res, next) {
  const h = req.headers.authorization || "";
  // Prefer the body token: the axios interceptor stamps the logged-in OWNER's token onto the
  // Authorization header, which would otherwise clobber the guardian's session in the same browser.
  const tok = req.body?.token || (h.startsWith("Bearer ") ? h.slice(7) : null);
  if (!tok) return res.status(401).json({ error: "Verify your email first." });
  try {
    const p = jwt.verify(tok, process.env.JWT_SECRET);
    if (p.kind !== "guardian") throw new Error("bad kind");
    req.guardian = p; next();
  } catch { return res.status(401).json({ error: "Your session expired - verify again." }); }
}

// Step 1: a guardian uploads a death certificate -> Gemini Vision gate
r.post("/verify", upload.single("cert"), async (req, res, next) => {
  try {
    const { userId } = req.body;
    const b64 = fs.readFileSync(req.file.path).toString("base64");
    const result = await gemini.verifyDeathCertificate(b64, req.file.mimetype);
    fs.unlink(req.file.path, () => {});
    await TriggerEvent.create({ userId, step: "cert_verified", status: result.looksValid ? "pass" : "fail", detail: result });
    res.json(result);
  } catch (e) { next(e); }
});

// Step 1.5: email a single-use OTP to a guardian so they verify before confirming.
r.post("/otp", async (req, res, next) => {
  try {
    const { userId, guardianIndex } = req.body;
    const guardians = await Guardian.find({ userId }).sort({ createdAt: 1 });
    const g = guardians[guardianIndex ?? -1];
    if (!g) return res.status(404).json({ error: "guardian not found" });
    const code = String(crypto.randomInt(100000, 1000000));
    g.otpCode = code;
    g.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await g.save();
    let sent = false, sendError = null;
    try {
      const r2 = await sendEmail({
        to: g.email,
        subject: "Your LastLogin verification code",
        text: `Your verification code is ${code}.\n\nIt confirms a serious, irreversible action. Only continue if you are certain.`,
      });
      sent = !r2?.mocked;
    } catch (e) { sendError = e.response?.data?.message || e.message; }
    // demoCode lets the flow work on Resend's free tier (own-inbox-only). Remove in production.
    res.json({ to: g.email, sent, sendError, demoCode: sent ? undefined : code });
  } catch (e) { next(e); }
});

// Step 2: a guardian confirms (OTP-verified). After the 2-of-3 quorum the estate executes.
r.post("/confirm", async (req, res, next) => {
  try {
    const { userId, guardianPrivateKey, guardianWallet, guardianIndex, code } = req.body;
    let txHash;

    if (guardianPrivateKey) {
      // Real on-chain confirmation (a fresh, funded contract). Each guardian signs.
      txHash = await chain.confirmDeath(guardianPrivateKey);
      if (guardianWallet)
        await Guardian.findOneAndUpdate(
          { userId, walletAddress: guardianWallet },
          { confirmed: true, confirmedAt: new Date(), otpCode: null, otpExpires: null }
        );
    } else {
      // Demo path: verify the guardian's emailed OTP (+ security answer) before confirming.
      const guardians = await Guardian.find({ userId }).sort({ createdAt: 1 });
      const g = guardians[guardianIndex ?? -1];
      if (!g) return res.status(400).json({ error: "guardian not found" });
      if (!g.otpCode || g.otpCode !== code || (g.otpExpires && g.otpExpires < new Date()))
        return res.status(401).json({ error: "Invalid or expired verification code." });
      const owner = await User.findById(userId).select("securityQuestion");
      if (owner?.securityQuestion?.answerHash) {
        const provided = crypto.createHash("sha256").update(String(req.body.securityAnswer || "").trim().toLowerCase()).digest("hex");
        if (provided !== owner.securityQuestion.answerHash)
          return res.status(401).json({ error: "Security answer is incorrect." });
      }
      // Mark THIS guardian confirmed directly - robust even when they have no wallet on file.
      // (The old wallet-match update silently no-op'd for wallet-less guardians, so the count
      //  never moved and the UI bounced back to "Confirm" in a loop.)
      g.confirmed = true; g.confirmedAt = new Date(); g.otpCode = null; g.otpExpires = null;
      await g.save();
      txHash = process.env.PROOF_TX || null;
    }

    await TriggerEvent.create({ userId, step: "guardian_confirmed", status: "ok", txHash });

    // Quorum reached? on-chain state for a real key, else the count of confirmed guardians.
    const executing = guardianPrivateKey
      ? (await chain.getState()).state === "EXECUTING"
      : (await Guardian.countDocuments({ userId, confirmed: true })) >= 2;

    if (executing) {
      await User.findByIdAndUpdate(userId, { estateState: "EXECUTING" });
      await Message.updateMany({ userId, deliverOn: "death" }, { delivered: true });
      await TriggerEvent.findOneAndUpdate(
        { userId, step: "executed" },
        { userId, step: "executed", status: "ok", txHash },
        { upsert: true }
      );
      // Notify each chosen recipient (best-effort) that a message awaits them.
      const u = await User.findById(userId).select("name");
      const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
      const recips = await Message.find({ userId, delivered: true, recipientEmail: { $nin: [null, ""] } });
      for (const m of recips) {
        try {
          await sendEmail({
            to: m.recipientEmail,
            subject: `A message from ${u?.name || "someone who loved you"}`,
            text: `${u?.name || "Someone"} left this message for you:\n\n"${m.text}"\n\nHear it in their own voice - and download it - here: ${origin}/inbox/${userId}`,
          });
        } catch {}
      }
    }
    const confirmedCount = await Guardian.countDocuments({ userId, confirmed: true });
    res.json({ txHash, executing, confirmedCount });
  } catch (e) { next(e); }
});

// Poll: current trigger status + on-chain state
r.get("/status/:userId", async (req, res, next) => {
  try {
    const [user, events, state, guardians] = await Promise.all([
      User.findById(req.params.userId),
      TriggerEvent.find({ userId: req.params.userId }).sort({ createdAt: 1 }),
      chain.getState().catch(() => null),
      Guardian.find({ userId: req.params.userId }),
    ]);
    res.json({
      estateState: user?.estateState,
      onChain: state,
      guardians: guardians.map((g) => ({ name: g.name, confirmed: g.confirmed })),
      confirmedGuardians: guardians.filter((g) => g.confirmed).length,
      threshold: 2,
      securityQuestion: user?.securityQuestion?.question || null,
      events,
    });
  } catch (e) { next(e); }
});

// Family view (unlocked only when EXECUTING)
r.get("/family/:userId", async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId);
    if (user?.estateState !== "EXECUTING")
      return res.status(403).json({ error: "estate not yet active" });
    const messages = await Message.find({ userId: req.params.userId, delivered: true, scope: "global" });
    const events = await TriggerEvent.find({ userId: req.params.userId });
    const executedTx = events.find((e) => e.step === "executed")?.txHash;
    // The proof behind the "verified death" narrative: a guardian-uploaded cert that passed Gemini Vision.
    const cert = events.find((e) => e.step === "cert_verified" && e.status === "pass");
    const certVerifiedAt = cert?.createdAt || null;
    res.json({ name: user.name, messages, executedTx, certVerifiedAt });
  } catch (e) { next(e); }
});

// --- Recipient delivery: a chosen recipient verifies their email (OTP) to open their messages ---
r.post("/recipient-otp", async (req, res, next) => {
  try {
    const { userId, email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
    const user = await User.findById(userId);
    const e = String(email).toLowerCase();
    // Access opens at death (EXECUTING marks every death-message delivered) OR when a
    // time-capsule addressed to them has already come due (delivered while still alive).
    const has = (await Message.find({ userId, delivered: true })).some((m) => m.scope === "global" || msgRecipients(m).includes(e));
    if (!has) {
      if (user?.estateState !== "EXECUTING") return res.status(403).json({ error: "Not yet available." });
      return res.status(404).json({ error: "No messages were left for that address." });
    }
    const code = String(crypto.randomInt(100000, 1000000));
    await setOtp(`rcp:${userId}:${email.toLowerCase()}`, code);
    let sent = false;
    try { const r2 = await sendEmail({ to: email, subject: "Your access code", text: `Your code to open the message left for you: ${code}` }); sent = !r2?.mocked; } catch {}
    res.json({ sent, demoCode: sent ? undefined : code });
  } catch (e) { next(e); }
});

r.post("/inbox", async (req, res, next) => {
  try {
    const { userId, email, code } = req.body;
    if (!(await takeOtp(`rcp:${userId}:${(email || "").toLowerCase()}`, code))) return res.status(401).json({ error: "Invalid or expired code." });
    const user = await User.findById(userId);
    const e = String(email || "").toLowerCase();
    const messages = (await Message.find({ userId, delivered: true }))
      .filter((m) => m.scope === "global" || msgRecipients(m).includes(e));
    res.json({ from: user?.name, messages });
  } catch (e) { next(e); }
});

// --- Guardian portal: a guardian verifies their email (OTP) to access what the owner permitted (RBAC) ---
r.post("/guardian-otp", async (req, res, next) => {
  try {
    const { userId, email } = req.body;
    if (!email) return res.status(400).json({ error: "Enter your email." });
    const g = await Guardian.findOne({ userId, email });
    if (!g) return res.status(404).json({ error: "You're not listed as a guardian for this person." });
    const code = String(crypto.randomInt(100000, 1000000));
    await setOtp(`ga:${userId}:${email.toLowerCase()}`, code);
    let sent = false;
    try { const r2 = await sendEmail({ to: email, subject: "Your guardian access code", text: `Your code to access this estate: ${code}` }); sent = !r2?.mocked; } catch {}
    res.json({ name: g.name, sent, demoCode: sent ? undefined : code });
  } catch (e) { next(e); }
});

r.post("/guardian-access", async (req, res, next) => {
  try {
    const { userId, email, code } = req.body;
    if (!(await takeOtp(`ga:${userId}:${(email || "").toLowerCase()}`, code))) return res.status(401).json({ error: "Invalid or expired code." });
    const g = await Guardian.findOne({ userId, email });
    if (!g) return res.status(404).json({ error: "You're not listed as a guardian for this person." });
    const user = await User.findById(userId).select("name estateState");
    res.json({ name: g.name, estateState: user?.estateState, ...(await guardianGrants(g, user)) });
  } catch (e) { next(e); }
});

// --- The /access flow: identify the estate, then verify yourself, then (if needed) report a passing. ---

// Step 1: find the estate by the person's email OR phone (no userId needed in the URL).
// Returns only the owner's name + the live confirmation count - never the guardian roster.
r.post("/lookup-estate", async (req, res, next) => {
  try {
    const id = String(req.body.identifier || "").trim();
    if (!id) return res.status(400).json({ error: "Enter the person's email or phone." });
    let user;
    if (id.includes("@")) {
      user = await User.findOne({ email: id.toLowerCase() }).select("name estateState");
    } else {
      const d = id.replace(/\D/g, "");
      const candidates = await User.find({ phone: { $nin: [null, ""] } }).select("name estateState phone");
      user = candidates.find((u) => String(u.phone).replace(/\D/g, "") === d) || null;
    }
    if (!user) return res.status(404).json({ error: "No estate found for that email or phone." });
    res.json({ userId: user._id, ownerName: user.name, estateState: user.estateState, ...(await guardianCounts(user._id)) });
  } catch (e) { next(e); }
});

// Step 3: verify the guardian's emailed OTP -> a short-lived session token. (Step 2 reuses /guardian-otp.)
r.post("/guardian-session", async (req, res, next) => {
  try {
    const { userId, email, code } = req.body;
    if (!(await takeOtp(`ga:${userId}:${String(email || "").toLowerCase()}`, String(code || "").trim())))
      return res.status(401).json({ error: "Invalid or expired code." });
    const g = await Guardian.findOne({ userId, email: new RegExp(`^${escRe(String(email).toLowerCase())}$`, "i") });
    if (!g) return res.status(404).json({ error: "You're not a guardian for this person." });
    const user = await User.findById(userId).select("name estateState");
    const token = jwt.sign({ kind: "guardian", gid: String(g._id), userId: String(userId), email: g.email }, process.env.JWT_SECRET, { expiresIn: "30m" });
    const executing = user?.estateState === "EXECUTING";
    res.json({
      token, guardianName: g.name, ownerName: user?.name, estateState: user?.estateState,
      youConfirmed: !!g.confirmed, executing, ...(await guardianCounts(userId)),
      ...(executing ? await guardianGrants(g, user) : {}),
    });
  } catch (e) { next(e); }
});

// A verified guardian uploads a death certificate. Their cert IS their confirmation. At 2 of 3
// the estate executes; on every upload the OTHER guardians are emailed to come and agree.
// multer FIRST so the multipart body (incl. the session token) is parsed before guardianAuth reads it.
r.post("/guardian-cert", upload.single("cert"), guardianAuth, async (req, res, next) => {
  try {
    const { userId, gid } = req.guardian;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "estate not found" });
    if (!req.file) return res.status(400).json({ error: "No certificate uploaded." });
    const b64 = fs.readFileSync(req.file.path).toString("base64");
    const result = await gemini.verifyDeathCertificate(b64, req.file.mimetype);
    const fileName = req.file.originalname;
    fs.unlink(req.file.path, () => {});
    await TriggerEvent.create({ userId, step: "cert_verified", status: result.looksValid ? "pass" : "fail", detail: result });
    if (!result.looksValid)
      return res.json({ certValid: false, reason: result.reason, ...(await guardianCounts(userId)) });

    await Guardian.findByIdAndUpdate(gid, { confirmed: true, confirmedAt: new Date(), certVerified: true, certName: fileName });
    const origin = process.env.CLIENT_ORIGIN || "http://localhost:5173";
    // Privacy: tell the OTHER guardians a passing was reported - never which guardian did it.
    const others = await Guardian.find({ userId, _id: { $ne: gid }, email: { $nin: [null, ""] } });
    for (const o of others) {
      try {
        await sendEmail({
          to: o.email,
          subject: `Action needed - a passing was reported for ${user.name}`,
          text: `A guardian has reported the passing of ${user.name} and uploaded a death certificate.\n\nTwo guardians must agree before anything is released. If you believe this is correct, please confirm:\n\n1) Go to ${origin}/access\n2) Enter ${user.name}'s email or phone\n3) Verify your own email with the code we send\n4) Upload the death certificate\n\nIf this is unexpected, do nothing and contact the family.`,
        });
      } catch {}
    }

    const counts = await guardianCounts(userId);
    let executing = user.estateState === "EXECUTING";
    if (!executing && counts.confirmedGuardians >= counts.threshold) {
      await User.findByIdAndUpdate(userId, { estateState: "EXECUTING" });
      await Message.updateMany({ userId, deliverOn: "death" }, { delivered: true });
      await TriggerEvent.findOneAndUpdate({ userId, step: "executed" }, { userId, step: "executed", status: "ok", txHash: process.env.PROOF_TX || null }, { upsert: true });
      executing = true;
      const emails = new Set();
      (await Message.find({ userId, delivered: true })).forEach((m) => msgRecipients(m).forEach((e) => e && emails.add(e)));
      for (const to of emails) {
        try { await sendEmail({ to, subject: `A message from ${user.name}`, text: `${user.name} left something for you. Open it at ${origin}/access (enter ${user.name}'s email), or ${origin}/inbox/${userId}.` }); } catch {}
      }
    }
    const g = await Guardian.findById(gid);
    const fresh = await User.findById(userId).select("name estateState");
    res.json({ certValid: true, executing, ...(await guardianCounts(userId)), ...(executing ? await guardianGrants(g, fresh) : {}) });
  } catch (e) { next(e); }
});

// Refresh the guardian's view (status counts; grants once executing) without re-entering an OTP.
r.post("/guardian-state", guardianAuth, async (req, res, next) => {
  try {
    const { userId, gid } = req.guardian;
    const g = await Guardian.findById(gid);
    const user = await User.findById(userId).select("name estateState");
    if (!g || !user) return res.status(404).json({ error: "not found" });
    const executing = user.estateState === "EXECUTING";
    res.json({
      guardianName: g.name, ownerName: user.name, estateState: user.estateState,
      youConfirmed: !!g.confirmed, executing, ...(await guardianCounts(userId)),
      ...(executing ? await guardianGrants(g, user) : {}),
    });
  } catch (e) { next(e); }
});

export default r;
