import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: String,
    voiceId: String, // ElevenLabs cloned voice id
    lastSeen: { type: Date, default: Date.now }, // proof-of-life
    estateState: { type: String, enum: ["ACTIVE", "EXECUTING"], default: "ACTIVE" },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
