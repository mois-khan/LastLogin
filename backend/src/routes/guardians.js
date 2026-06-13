import { Router } from "express";
import { auth } from "../middleware/auth.js";
import Guardian from "../models/Guardian.js";

const r = Router();
r.use(auth);

r.get("/", async (req, res, next) => {
  try {
    const guardians = await Guardian.find({ userId: req.user.id });
    const confirmed = guardians.filter((g) => g.confirmed).length;
    res.json({ guardians, confirmed, threshold: 2 });
  } catch (e) { next(e); }
});

r.post("/", async (req, res, next) => {
  try {
    const { name, email, walletAddress } = req.body;
    const g = await Guardian.create({ userId: req.user.id, name, email, walletAddress });
    res.json(g);
  } catch (e) { next(e); }
});

export default r;
