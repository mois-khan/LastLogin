import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Account from "../models/Account.js";
import User from "../models/User.js";
import * as gemini from "../services/ai/gemini.js";
import { sendEmail } from "../services/notify/email.js";

const r = Router();
r.use(auth);

r.get("/", async (req, res, next) => {
  try { res.json(await Account.find({ userId: req.user.id }).sort({ createdAt: 1 })); }
  catch (e) { next(e); }
});

r.post("/", async (req, res, next) => {
  try {
    const { platform, domain, category, action, contactEmail } = req.body;
    const a = await Account.create({ userId: req.user.id, platform, domain, category, action, contactEmail });
    res.json(a);
  } catch (e) { next(e); }
});

r.delete("/:id", async (req, res, next) => {
  try { await Account.deleteOne({ _id: req.params.id, userId: req.user.id }); res.json({ ok: true }); }
  catch (e) { next(e); }
});

// Gemini drafts the platform-specific request for this account's chosen action.
r.post("/:id/draft", async (req, res, next) => {
  try {
    const a = await Account.findOne({ _id: req.params.id, userId: req.user.id });
    if (!a) return res.status(404).json({ error: "not found" });
    const user = await User.findById(req.user.id);
    a.draft = await gemini.draftClosureEmail(a.platform, a.action, user?.name || "the account holder");
    await a.save();
    res.json({ draft: a.draft });
  } catch (e) { next(e); }
});

// Send the request via Resend (to a test inbox for the demo).
r.post("/:id/send", async (req, res, next) => {
  try {
    const a = await Account.findOne({ _id: req.params.id, userId: req.user.id });
    if (!a) return res.status(404).json({ error: "not found" });
    const user = await User.findById(req.user.id);
    if (!a.draft) a.draft = await gemini.draftClosureEmail(a.platform, a.action, user?.name || "the account holder");
    const verb = a.action === "memorialize" ? "Memorialization" : a.action === "transfer" ? "Transfer" : "Closure";
    const to = a.contactEmail || user?.email;
    try {
      const result = await sendEmail({ to, subject: `${verb} request — ${a.platform}`, text: a.draft });
      a.status = "sent"; a.sentAt = new Date(); await a.save();
      res.json({ ok: true, mocked: !!result?.mocked, sentTo: to });
    } catch (sendErr) {
      // Resend free tier only delivers to your own verified address — surface it clearly.
      res.json({ ok: false, error: sendErr.response?.data?.message || sendErr.message });
    }
  } catch (e) { next(e); }
});

export default r;
