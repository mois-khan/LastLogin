import { Router } from "express";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";
import * as chain from "../services/blockchain/ethers.js";

const r = Router();
r.use(auth);

// "I'm still here" — resets the dead-man's switch (Mongo lastSeen) AND the on-chain
// proveLife() timer. The on-chain call is best-effort: skipped in a Mongo-only demo.
r.post("/", async (req, res, next) => {
  try {
    const now = new Date();
    await User.findByIdAndUpdate(req.user.id, { lastSeen: now });
    let txHash = null;
    try { txHash = await chain.proveLife(); }
    catch (e) { console.warn("on-chain proveLife skipped:", e.message); }
    res.json({ ok: true, lastSeen: now, txHash });
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
