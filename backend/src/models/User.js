import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, unique: true, required: true, lowercase: true },
    passwordHash: { type: String, required: true },
    name: String,
    phone: { type: String, index: true }, // lets a guardian look up the estate by phone
    // Drives gendered grammar in Indian-language translation (karta vs karti) + the clone's voice.
    gender: { type: String, enum: ["male", "female", "neutral"], default: "neutral" },
    voiceId: String, // ElevenLabs cloned voice id
    lastSeen: { type: Date, default: Date.now }, // proof-of-life
    estateState: { type: String, enum: ["ACTIVE", "EXECUTING"], default: "ACTIVE" },
    // Zero-knowledge vault: PBKDF2 salt + a tiny client-encrypted verifier blob.
    // The master passphrase / derived key NEVER reach the server.
    vaultSalt: String,
    vaultVerifier: { iv: String, data: String },
    // Optional extra guardian challenge: a question + a hashed answer.
    securityQuestion: { question: String, answerHash: String },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
