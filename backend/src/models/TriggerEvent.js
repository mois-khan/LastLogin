import mongoose from "mongoose";

const triggerEventSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    step: String, // cert_verified | guardian_confirmed | executed
    status: String,
    detail: mongoose.Schema.Types.Mixed,
    txHash: String,
  },
  { timestamps: true }
);

export default mongoose.model("TriggerEvent", triggerEventSchema);
