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
import TriggerEvent from "../models/TriggerEvent.js";
import * as gemini from "../services/ai/gemini.js";
import * as chain from "../services/blockchain/ethers.js";

const UPLOAD_DIR = path.join(os.tmpdir(), "lastlogin-uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: UPLOAD_DIR });
const r = Router();
const recipientOtps = new Map(); // `${userId}:${email}` -> { code, expires }
const guardianOtps = new Map(); // guardian portal access codes

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
    let txHash, wallet = guardianWallet;

    if (guardianPrivateKey) {
      // Real on-chain confirmation (a fresh, funded contract). Each guardian signs.
      txHash = await chain.confirmDeath(guardianPrivateKey);
    } else {
      // Demo path: verify the guardian's emailed OTP before accepting the confirmation.
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
      wallet = g.walletAddress;
      txHash = process.env.PROOF_TX || null;
    }

    if (wallet)
      await Guardian.findOneAndUpdate(
        { userId, walletAddress: wallet },
        { confirmed: true, confirmedAt: new Date(), otpCode: null, otpExpires: null }
      );
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
            text: `${u?.name || "Someone"} left a message for you in LastLogin. Open it: ${origin}/inbox/${userId}`,
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
    const messages = await Message.find({ userId: req.params.userId, delivered: true });
    const events = await TriggerEvent.find({ userId: req.params.userId });
    const executedTx = events.find((e) => e.step === "executed")?.txHash;
    res.json({ name: user.name, messages, executedTx });
  } catch (e) { next(e); }
});

// --- Recipient delivery: a chosen recipient verifies their email (OTP) to open their messages ---
r.post("/recipient-otp", async (req, res, next) => {
  try {
    const { userId, email } = req.body;
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) return res.status(400).json({ error: "Enter a valid email." });
    const user = await User.findById(userId);
    if (user?.estateState !== "EXECUTING") return res.status(403).json({ error: "Not yet available." });
    const has = await Message.exists({ userId, delivered: true, recipientEmail: email });
    if (!has) return res.status(404).json({ error: "No messages were left for that address." });
    const code = String(crypto.randomInt(100000, 1000000));
    recipientOtps.set(`${userId}:${email.toLowerCase()}`, { code, expires: Date.now() + 10 * 60 * 1000 });
    let sent = false;
    try { const r2 = await sendEmail({ to: email, subject: "Your access code", text: `Your code to open the message left for you: ${code}` }); sent = !r2?.mocked; } catch {}
    res.json({ sent, demoCode: sent ? undefined : code });
  } catch (e) { next(e); }
});

r.post("/inbox", async (req, res, next) => {
  try {
    const { userId, email, code } = req.body;
    const rec = recipientOtps.get(`${userId}:${(email || "").toLowerCase()}`);
    if (!rec || rec.code !== code || rec.expires < Date.now()) return res.status(401).json({ error: "Invalid or expired code." });
    recipientOtps.delete(`${userId}:${email.toLowerCase()}`); // single-use
    const user = await User.findById(userId);
    const messages = await Message.find({ userId, delivered: true, recipientEmail: email });
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
    guardianOtps.set(`${userId}:${email.toLowerCase()}`, { code, expires: Date.now() + 10 * 60 * 1000 });
    let sent = false;
    try { const r2 = await sendEmail({ to: email, subject: "Your guardian access code", text: `Your code to access this estate: ${code}` }); sent = !r2?.mocked; } catch {}
    res.json({ name: g.name, sent, demoCode: sent ? undefined : code });
  } catch (e) { next(e); }
});

r.post("/guardian-access", async (req, res, next) => {
  try {
    const { userId, email, code } = req.body;
    const rec = guardianOtps.get(`${userId}:${(email || "").toLowerCase()}`);
    if (!rec || rec.code !== code || rec.expires < Date.now()) return res.status(401).json({ error: "Invalid or expired code." });
    guardianOtps.delete(`${userId}:${email.toLowerCase()}`); // single-use
    const g = await Guardian.findOne({ userId, email });
    const user = await User.findById(userId).select("name estateState");
    let items = [];
    if (user?.estateState === "EXECUTING" && g.access?.length) {
      const found = await VaultItem.find({ userId, type: { $in: g.access } });
      items = found.map((i) => {
        if (i.scheme === "server") {
          try {
            const raw = decrypt(i.blob);
            let fields; try { fields = JSON.parse(raw); } catch { fields = { value: raw }; }
            return { type: i.type, label: i.label, fields };
          } catch { return { type: i.type, label: i.label, locked: true }; }
        }
        return { type: i.type, label: i.label, locked: true }; // zero-knowledge — opens with the guardian quorum (Shamir)
      });
    }
    res.json({ name: g.name, access: g.access, estateState: user?.estateState, items });
  } catch (e) { next(e); }
});

export default r;
