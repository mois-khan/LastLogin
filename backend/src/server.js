import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import vaultRoutes from "./routes/vault.js";
import guardianRoutes from "./routes/guardians.js";
import messageNote from "./routes/proofOfLife.js";
import aiRoutes from "./routes/ai.js";
import triggerRoutes from "./routes/trigger.js";
import accountRoutes from "./routes/accounts.js";

dotenv.config();

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: "25mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "lastlogin" }));

app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);
app.use("/api/guardians", guardianRoutes);
app.use("/api/proof-of-life", messageNote);
app.use("/api/ai", aiRoutes);
app.use("/api/trigger", triggerRoutes);
app.use("/api/accounts", accountRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`LastLogin backend on :${PORT}`)))
  .catch((e) => {
    console.error("Startup failed:", e.message);
    // Start anyway so non-DB routes (health) work during a demo if Atlas hiccups
    app.listen(PORT, () => console.log(`LastLogin backend on :${PORT} (no DB)`));
  });
