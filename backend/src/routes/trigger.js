import { Router } from "express";
import multer from "multer";
import fs from "fs";
import { auth } from "../middleware/auth.js";
import User from "../models/User.js";
import Guardian from "../models/Guardian.js";
import Message from "../models/Message.js";
import TriggerEvent from "../models/TriggerEvent.js";
import * as gemini from "../services/ai/gemini.js";
import * as chain from "../services/blockchain/ethers.js";

const upload = multer({ dest: "/tmp/uploads/" });
const r = Router();

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

// Step 2: a guardian confirms on-chain. After threshold the contract auto-executes.
r.post("/confirm", async (req, res, next) => {
  try {
    const { userId, guardianPrivateKey, guardianWallet, guardianIndex } = req.body;
    let txHash, wallet = guardianWallet;

    if (guardianPrivateKey) {
      // Real on-chain confirmation (a fresh, funded contract). Each guardian signs.
      txHash = await chain.confirmDeath(guardianPrivateKey);
    } else {
      // Demo confirmation: record the guardian's action. The estate's on-chain
      // settlement is the contract's real prior execution, surfaced via PROOF_TX.
      const addrs = (process.env.DEMO_GUARDIAN_ADDRS || "").split(",").map((s) => s.trim()).filter(Boolean);
      wallet = wallet || addrs[guardianIndex ?? -1];
      txHash = process.env.PROOF_TX || null;
    }

    if (wallet)
      await Guardian.findOneAndUpdate(
        { userId, walletAddress: wallet },
        { confirmed: true, confirmedAt: new Date() }
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

export default r;
