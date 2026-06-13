import { Router } from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";

const r = Router();
r.use(auth);

// "I'm still here" — resets the dead-man's switch. (On-chain proveLife() optional.)
r.post("/", async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { lastSeen: new Date() });
    res.json({ ok: true, lastSeen: new Date() });
  } catch (e) { next(e); }
});

r.get("/status", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    const days = Math.floor((Date.now() - user.lastSeen.getTime()) / 86400000);
    res.json({ lastSeen: user.lastSeen, daysInactive: days });
  } catch (e) { next(e); }
});

export default r;
