import mongoose from "mongoose";

// Per-guardian colour for the companion: a SUMMARY of how the owner related to this one
// person (tone, pet names, inside jokes), distilled from a WhatsApp export. The raw chat is
// never stored — only this summary, and never any sensitive data (numbers, addresses, OTPs).
const guardianContextSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    guardianId: { type: mongoose.Schema.Types.ObjectId, ref: "Guardian", index: true },
    guardianEmail: String,
    summary: String,
  },
  { timestamps: true }
);
guardianContextSchema.index({ userId: 1, guardianId: 1 }, { unique: true });

export default mongoose.model("GuardianContext", guardianContextSchema);
