import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { auth } from "../middleware/auth.js";

const r = Router();

r.post("/register", async (req, res, next) => {
  try {
    const { email, password, name, phone } = req.body;
    if (!email || !password) return res.status(400).json({ error: "email & password required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ error: "email already registered" });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, name, phone });
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, email, name, phone, gender: user.gender } });
  } catch (e) { next(e); }
});

r.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      return res.status(401).json({ error: "invalid credentials" });
    user.lastSeen = new Date(); await user.save();
    const token = jwt.sign({ id: user._id, email }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user._id, email, name: user.name, phone: user.phone, gender: user.gender, voiceId: user.voiceId } });
  } catch (e) { next(e); }
});

// Update your own profile (name / phone / gender). Drives the voice-grammar selector + clone.
r.post("/profile", auth, async (req, res, next) => {
  try {
    const patch = {};
    for (const f of ["name", "phone", "gender"]) if (req.body[f] !== undefined) patch[f] = req.body[f];
    const u = await User.findByIdAndUpdate(req.user.id, patch, { new: true }).select("name email phone gender voiceId");
    res.json({ id: u._id, name: u.name, email: u.email, phone: u.phone, gender: u.gender, voiceId: u.voiceId });
  } catch (e) { next(e); }
});

export default r;
