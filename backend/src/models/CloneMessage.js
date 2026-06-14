import mongoose from "mongoose";

// One turn in a companion conversation. History is isolated per (userId, guardianId);
// owner previews use guardianId=null + ownerPreview=true.
const cloneMessageSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    guardianId: { type: mongoose.Schema.Types.ObjectId, ref: "Guardian", index: true, default: null },
    ownerPreview: { type: Boolean, default: false },
    role: { type: String, enum: ["guardian", "clone"] },
    text: String, // shown text (already in the listener's language)
    language: { type: String, default: "en-IN" },
    audioUrl: String,
  },
  { timestamps: true }
);

export default mongoose.model("CloneMessage", cloneMessageSchema);
