import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./config/db.js";
import { errorHandler } from "./middleware/error.js";

import authRoutes from "./routes/auth.js";
import vaultRoutes from "./routes/vault.js";
import guardianRoutes from "./routes/guardians.js";
import messageNote from "./routes/proofOfLife.js";
import aiRoutes from "./routes/ai.js";
import triggerRoutes from "./routes/trigger.js";
import accountRoutes from "./routes/accounts.js";
import attachmentRoutes from "./routes/attachments.js";
import cloneRoutes from "./routes/clone.js";

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
app.use("/api/attachments", attachmentRoutes);
app.use("/api/clone", cloneRoutes);

// Production: serve the built frontend from this same server (one origin — no CORS, no proxy).
// Skipped automatically in dev (no dist yet): there you run Vite on :5173 with its /api proxy.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.resolve(__dirname, "../../frontend/dist");
if (fs.existsSync(DIST)) {
  app.use(express.static(DIST));
  // SPA fallback: any non-API GET returns index.html so deep links (/access, /app/*) survive a refresh.
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api") || req.path === "/health") return next();
    res.sendFile(path.join(DIST, "index.html"));
  });
  console.log("Serving built frontend from", DIST);
}

app.use(errorHandler);

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`LastLogin backend on :${PORT}`)))
  .catch((e) => {
    console.error("Startup failed:", e.message);
    // Start anyway so non-DB routes (health) work during a demo if Atlas hiccups
    app.listen(PORT, () => console.log(`LastLogin backend on :${PORT} (no DB)`));
  });
