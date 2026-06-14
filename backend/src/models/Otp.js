import mongoose from "mongoose";

// Short-lived, single-use codes (guardian-portal access, recipient inbox). Persisted
// in Mongo so they survive a server reload - the old in-memory Map lost them.
const otpSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, index: true }, // e.g. "ga:<userId>:<email>"
    code: String,
    expiresAt: Date,
  },
  { timestamps: true }
);

export default mongoose.model("Otp", otpSchema);
